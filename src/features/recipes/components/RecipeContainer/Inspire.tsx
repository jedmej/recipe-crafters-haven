import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2, Save, RefreshCw, Clock, Timer, Flame, ArrowLeft, Tags, ListPlus, Search } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import ImageGenerator from "@/components/ImageGenerator";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { ImageUploadOrGenerate } from "@/components/recipes/ImageUploadOrGenerate";
import { RecipeActions } from "../RecipeDetail/RecipeActions";
import { RecipeIngredients } from "../RecipeDetail/RecipeIngredients";
import { PageLayout } from './PageLayout';
import { RecipeDisplay } from "@/components/recipes/RecipeDisplay";

// Types and constants for language codes and categories
const LANGUAGE_CODES = {
  'English': 'en',
  'Spanish': 'es',
  'French': 'fr',
  'Italian': 'it',
  'German': 'de',
  'Polish': 'pl'
};

const LANGUAGE_NAMES = {
  'en': 'English',
  'es': 'Spanish', 
  'fr': 'French',
  'it': 'Italian',
  'de': 'German',
  'pl': 'Polish'
};

const FILTER_CATEGORIES = {
  mealType: {
    title: "Meal Type",
    options: ["Breakfast", "Brunch", "Lunch", "Dinner", "Snacks", "Dessert", "Appetizer"],
    badgeClass: "bg-blue-100 text-blue-800"
  },
  dietaryRestrictions: {
    title: "Dietary Restrictions",
    options: ["Vegetarian", "Vegan", "Gluten-free", "Dairy-free", "Keto", "Paleo", "Halal", "Kosher"],
    badgeClass: "bg-green-100 text-green-800"
  },
  difficultyLevel: {
    title: "Difficulty Level",
    options: ["Easy", "Medium", "Hard"],
    badgeClass: "bg-yellow-100 text-yellow-800"
  },
  cuisineType: {
    title: "Cuisine Type",
    options: ["Italian", "Mexican", "Asian", "French", "Middle Eastern", "Indian", "American", "Mediterranean"],
    badgeClass: "bg-purple-100 text-purple-800"
  }
};
import { Separator } from "@/components/ui/separator";

export function InspireContainer() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { preferences } = useUserPreferences();
  const [searchQuery, setSearchQuery] = useState('');

  // State for recipe inspiration form
  const [ingredients, setIngredients] = useState<string>("");
  const [cookingTime, setCookingTime] = useState<number>(30);
  const [filters, setFilters] = useState<{ [key: string]: string[] }>({
    mealType: [],
    dietaryRestrictions: [],
    difficultyLevel: [],
    cuisineType: []
  });
  const [language, setLanguage] = useState<string>(preferences.language || 'en');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedRecipe, setGeneratedRecipe] = useState<any>(null);
  const [recipeImage, setRecipeImage] = useState<string | null>(null);
  const [useIngredients, setUseIngredients] = useState<boolean>(false);
  
  // State for recipe detail view
  const [desiredServings, setDesiredServings] = useState(4);
  const [measurementSystem, setMeasurementSystem] = useState<'metric' | 'imperial'>(
    preferences.measurementSystem || 'metric'
  );
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [showImageGenerator, setShowImageGenerator] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Update language when user preferences change
  useEffect(() => {
    setLanguage(preferences.language || 'en');
  }, [preferences.language]);

  // Filter management functions
  const toggleFilter = (category: string, option: string) => {
    setFilters(prev => {
      const currentCategoryFilters = prev[category] || [];
      const updatedCategoryFilters = currentCategoryFilters.includes(option)
        ? currentCategoryFilters.filter(item => item !== option)
        : [...currentCategoryFilters, option];
      
      return {
        ...prev,
        [category]: updatedCategoryFilters
      };
    });
  };

  // Compound active filters for API call
  const activeFilters = useMemo(() => {
    return Object.entries(filters)
      .flatMap(([category, options]) => options)
      .filter(Boolean);
  }, [filters]);

  // Recipe generation mutation
  const generateRecipe = useMutation({
    mutationFn: async ({ query, mode }: { query?: string; mode: 'search' | 'inspire' } = { mode: 'inspire' }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("User not authenticated");

      // If in search mode, use the search query directly
      if (mode === 'search' && query) {
        const { data, error } = await supabase.functions.invoke('recipe-chat', {
          body: { query, language }
        });

        if (error) throw error;
        return data;
      }

      // Transform filters into categories object with all required fields
      const categoryFilters = {
        meal_type: filters.mealType?.[0] || null,
        dietary_restrictions: filters.dietaryRestrictions?.[0] || null,
        difficulty_level: filters.difficultyLevel?.[0] || null,
        cuisine_type: filters.cuisineType?.[0] || null,
        cooking_method: null // Add this field even if we don't have UI for it yet
      };

      // Prepare input for AI edge function
      const inputData = {
        ingredients: useIngredients ? ingredients.split(',').map(i => i.trim()).filter(Boolean) : [],
        targetLanguage: language,
        cookingTime: cookingTime,
        filters: activeFilters,
        categoryFilters: categoryFilters,
        measurementSystem: measurementSystem,
        useIngredients: useIngredients,
        generateAllCategories: true
      };

      // Call the AI edge function
      const { data, error } = await supabase.functions.invoke('ai-recipe-generate', {
        body: inputData
      });

      if (error) throw error;
      if (!data) throw new Error('No recipe data returned');
      
      return data;
    },
    onSuccess: (data) => {
      // Extract the recipe data from the response
      console.log('Recipe generation response:', data);
      const recipeData = data?.data || data;
      
      // Ensure the recipe has a categories object structure
      if (!recipeData.categories) {
        recipeData.categories = {};
      }
      
      // If categories are in the recipe root instead of the categories object, move them
      const categoryFields = ['meal_type', 'dietary_restrictions', 'difficulty_level', 'cuisine_type', 'cooking_method'];
      
      categoryFields.forEach(field => {
        if (recipeData[field] && !recipeData.categories[field]) {
          recipeData.categories[field] = recipeData[field];
          delete recipeData[field]; // Remove from root to avoid duplication
        }
      });
      
      // Set default values for any missing categories
      if (!recipeData.categories.meal_type) recipeData.categories.meal_type = filters.mealType?.[0] || "Main Dish";
      if (!recipeData.categories.dietary_restrictions) recipeData.categories.dietary_restrictions = filters.dietaryRestrictions?.[0] || "Regular";
      if (!recipeData.categories.difficulty_level) recipeData.categories.difficulty_level = filters.difficultyLevel?.[0] || "Medium"; 
      if (!recipeData.categories.cuisine_type) recipeData.categories.cuisine_type = filters.cuisineType?.[0] || "International";
      if (!recipeData.categories.cooking_method) recipeData.categories.cooking_method = "Various";
      
      setGeneratedRecipe(recipeData);
      toast({
        title: "Recipe Generated Successfully",
        description: "Your new recipe is ready to review and save!",
      });
    },
    onError: (error: Error) => {
      console.error('Generate error:', error);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: "We couldn't generate a recipe with these criteria. Please try different options.",
      });
    },
    onSettled: () => {
      setIsGenerating(false);
    }
  });

  // Recipe saving mutation
  const saveRecipe = useMutation({
    mutationFn: async () => {
      if (!generatedRecipe) throw new Error("No recipe to save");
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("User not authenticated");

      // Format categories for the database using both user-selected filters and recipe data
      const recipeData = generatedRecipe.data || generatedRecipe;
      
      // Use the displayCategories to ensure all category fields are populated
      const formattedCategories = {
        meal_type: recipeData.categories?.meal_type || filters.mealType?.[0] || "Main Dish",
        dietary_restrictions: recipeData.categories?.dietary_restrictions || filters.dietaryRestrictions?.[0] || "Regular",
        difficulty_level: recipeData.categories?.difficulty_level || filters.difficultyLevel?.[0] || "Medium",
        cuisine_type: recipeData.categories?.cuisine_type || filters.cuisineType?.[0] || "International",
        cooking_method: recipeData.categories?.cooking_method || "Various"
      };
      
      // Handle additional dietary restrictions if selected by user
      if (filters.dietaryRestrictions?.length > 1) {
        formattedCategories.secondary_dietary_restrictions = filters.dietaryRestrictions.slice(1);
      }

      // Log the recipe structure before saving
      console.log('Saving recipe with structure:', JSON.stringify(generatedRecipe, null, 2));
      
      // Prepare recipe data for saving
      const recipeToSave = {
        title: recipeData.title || "Untitled Recipe",
        description: recipeData.description || "",
        ingredients: Array.isArray(recipeData.ingredients) ? recipeData.ingredients : [],
        instructions: Array.isArray(recipeData.instructions) ? recipeData.instructions : [],
        prep_time: parseInt(recipeData.prep_time) || 0,
        cook_time: parseInt(recipeData.cook_time) || cookingTime,
        servings: parseInt(recipeData.servings || recipeData.suggested_portions) || 4,
        suggested_portions: parseInt(recipeData.suggested_portions) || 4,
        estimated_calories: parseInt(recipeData.estimated_calories) || 0,
        portion_description: recipeData.portion_description || "servings",
        image_url: recipeImage,
        user_id: session.user.id,
        language: language,
        categories: formattedCategories
      };

      // Save the recipe to the database
      const { data, error } = await supabase
        .from('recipes')
        .insert([recipeToSave])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      navigate(`/recipes/${data.id}`);
      toast({
        title: "Recipe Saved",
        description: "The recipe has been added to your collection.",
      });
    },
    onError: (error: Error) => {
      console.error('Save error:', error);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "We couldn't save this recipe. Please try again.",
      });
    }
  });

  const handleGenerateRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear search query when using inspire section
    setSearchQuery("");
    
    setIsGenerating(true);
    setGeneratedRecipe(null);
    setRecipeImage(null);
    generateRecipe.mutate({ mode: 'inspire' });
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      toast({
        title: "Error",
        description: "Please enter a search query",
        variant: "destructive",
      });
      return;
    }
    setIsGenerating(true);
    setGeneratedRecipe(null);
    setRecipeImage(null);
    
    // Clear any inspire section inputs
    setIngredients("");
    setCookingTime(30);
    setFilters({
      mealType: [],
      dietaryRestrictions: [],
      difficultyLevel: [],
      cuisineType: []
    });
    setUseIngredients(false);
    
    try {
      await generateRecipe.mutateAsync({ query: searchQuery, mode: 'search' });
    } catch (error) {
      setIsGenerating(false);
    }
  };

  const handleSaveRecipe = () => {
    saveRecipe.mutate();
  };

  const handleImageSelected = (imageUrl: string) => {
    setRecipeImage(imageUrl);
  };

  const handleServingsChange = (newServings: number) => {
    setDesiredServings(newServings);
  };

  const toggleMeasurementSystem = () => {
    setMeasurementSystem(prev => prev === 'metric' ? 'imperial' : 'metric');
  };

  const calculateCaloriesPerServing = (totalCalories: number, totalServings: number) => {
    if (totalServings <= 0) return 0;
    return Math.round(totalCalories / totalServings);
  };

  const addToGroceryList = () => {
    // Implementation for adding to grocery list
    toast({
      title: "Added to Grocery List",
      description: "Ingredients have been added to your shopping list.",
    });
  };

  return (
    <PageLayout>
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => navigate("/recipes")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Recipes
      </Button>
      
      {/* Search Section */}
      {!generatedRecipe && <Card className="mb-8">
        <CardContent className="p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Find Your Perfect Recipe</h1>
          
          <form onSubmit={handleSearch} className="space-y-4" disabled={isGenerating}>
            <div className="space-y-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="What would you like to cook? (e.g., 'vegetarian pasta', 'quick breakfast')"
                className="text-lg"
                disabled={isGenerating}
              />
            </div>
            
            <div className="flex gap-4">
              <Select
                value={language}
                onValueChange={setLanguage}
                disabled={isGenerating}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LANGUAGE_NAMES).map(([code, name]) => (
                    <SelectItem key={code} value={code}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="submit" disabled={isGenerating} className="flex-1">
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>}
      
      {/* Divider */}
      {!generatedRecipe && <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-gray-50 px-2 text-muted-foreground">or let us inspire you</span>
        </div>
      </div>}
      
      {/* Recipe generation form */}
      {!generatedRecipe && (
        <Card className="mb-8">
          <CardContent className="p-6">
            <h1 className="text-3xl font-bold mb-6">Get Inspired with AI</h1>
            
            <form onSubmit={handleGenerateRecipe} className="space-y-8" disabled={isGenerating}>
              {/* Ingredients section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Switch 
                    id="use-ingredients" 
                    checked={useIngredients} 
                    onCheckedChange={setUseIngredients}
                  />
                  <Label htmlFor="use-ingredients" className="font-medium">Use ingredients</Label>
                </div>
                
                {useIngredients && (
                  <div className="space-y-2">
                    <Label htmlFor="ingredients">Ingredients (comma separated)</Label>
                    <Input
                      id="ingredients"
                      placeholder="e.g., chicken, rice, tomatoes, olive oil"
                      value={ingredients}
                      onChange={(e) => setIngredients(e.target.value)}
                      disabled={isGenerating}
                    />
                    <p className="text-sm text-muted-foreground">
                      Add ingredients you want to use in your recipe
                    </p>
                  </div>
                )}
              </div>
              
              {/* Cooking time slider */}
              <div className="space-y-4">
                <Label className="font-medium">Cooking Time: {cookingTime} minutes</Label>
                <Slider
                  min={10}
                  max={120}
                  step={5}
                  value={[cookingTime]}
                  onValueChange={(value) => setCookingTime(value[0])}
                  disabled={isGenerating}
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>10 min</span>
                  <span>60 min</span>
                  <span>120 min</span>
                </div>
              </div>
              
              {/* Filters section */}
              <div className="space-y-4">
                <h3 className="font-medium">Filters</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(FILTER_CATEGORIES).map(([category, { title, options }]) => (
                    <div key={category} className="space-y-2">
                      <Label className="text-sm font-medium">{title}</Label>
                      <div className="flex flex-wrap gap-2">
                        {options.map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => toggleFilter(category, option)}
                            className={`px-3 py-1 rounded-full text-sm ${
                              filters[category]?.includes(option)
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                            }`}
                            disabled={isGenerating}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Language selection */}
              <div className="space-y-2">
                <Label htmlFor="language" className="font-medium">Language</Label>
                <Select
                  value={language}
                  onValueChange={(value) => setLanguage(value)}
                  disabled={isGenerating}
                >
                  <SelectTrigger id="language" className="w-full md:w-[200px]">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(LANGUAGE_NAMES).map(([code, name]) => (
                      <SelectItem key={code} value={code}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Submit button */}
              <Button
                type="submit"
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Recipe...
                  </>
                ) : (
                  "Generate Recipe"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
      
      {/* Recipe display section */}
      {generatedRecipe && (
        <RecipeDisplay
          recipe={{
            ...generatedRecipe,
            imageUrl: recipeImage
          }}
          scaledRecipe={{
            ...generatedRecipe,
            imageUrl: recipeImage
          }}
          chosenPortions={desiredServings}
          onPortionsChange={setDesiredServings}
          measurementSystem={measurementSystem}
          onMeasurementSystemChange={toggleMeasurementSystem}
          onSave={handleSaveRecipe}
          isSaving={saveRecipe.isPending}
          onImageUpdate={handleImageSelected}
          onEditOrGenerate={() => {
            if (!generatedRecipe.id) {
              setGeneratedRecipe(null);
              setRecipeImage(null);
            } else {
              // Handle edit case if needed
              console.log("Edit functionality not implemented yet");
            }
          }}
          isRegenerating={false}
        />
      )}
    </PageLayout>
  );
} 