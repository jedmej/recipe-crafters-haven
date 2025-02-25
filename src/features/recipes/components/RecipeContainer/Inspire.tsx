import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2, Save, RefreshCw, Clock, Timer, Flame } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import ImageGenerator from "@/components/ImageGenerator";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { PageLayout } from './PageLayout';

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

export function InspireContainer() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { preferences } = useUserPreferences();

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
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("User not authenticated");

      // Prepare input for AI edge function
      const inputData = {
        ingredients: useIngredients ? ingredients.split(',').map(i => i.trim()).filter(Boolean) : [],
        targetLanguage: language,
        cookingTime: cookingTime,
        filters: activeFilters,
        measurementSystem: preferences.measurementSystem || 'metric',
        useIngredients: useIngredients
      };

      // Call the AI edge function
      const { data, error } = await supabase.functions.invoke('ai-recipe-generation', {
        body: inputData
      });

      if (error) throw error;
      if (!data) throw new Error('No recipe data returned');
      
      return data;
    },
    onSuccess: (data) => {
      setGeneratedRecipe(data);
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

      // Format categories for the database
      const formattedCategories: any = {};
      
      if (filters.mealType?.[0]) {
        formattedCategories.meal_type = filters.mealType[0];
      }
      
      if (filters.cuisineType?.[0]) {
        formattedCategories.cuisine_type = filters.cuisineType[0];
      }
      
      if (filters.difficultyLevel?.[0]) {
        formattedCategories.difficulty_level = filters.difficultyLevel[0];
      }

      if (filters.dietaryRestrictions?.length) {
        formattedCategories.dietary_restrictions = filters.dietaryRestrictions;
      }

      // Prepare recipe data for saving
      const recipeToSave = {
        title: generatedRecipe.title,
        description: generatedRecipe.description || "",
        ingredients: generatedRecipe.ingredients || [],
        instructions: generatedRecipe.instructions || [],
        prep_time: generatedRecipe.prep_time || 0,
        cook_time: generatedRecipe.cook_time || cookingTime,
        servings: generatedRecipe.servings || 4,
        image_url: recipeImage,
        user_id: session.user.id,
        language: language,
        categories: formattedCategories,
        ai_generated: true
      };

      // Save to database
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
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "We couldn't save this recipe. Please try again.",
      });
    }
  });

  // Handle generate recipe submission
  const handleGenerateRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    generateRecipe.mutate();
  };

  // Handle save recipe
  const handleSaveRecipe = () => {
    saveRecipe.mutate();
  };

  // Handle image selection
  const handleImageSelected = (imageUrl: string) => {
    setRecipeImage(imageUrl);
    toast({
      title: "Image Selected",
      description: "The image will be saved with your recipe."
    });
  };

  return (
    <PageLayout>
      <Button
        variant="ghost"
        onClick={() => navigate("/recipes")}
        className="mb-4"
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Back to Recipes
      </Button>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recipe Generator Form */}
        <div>
          <Card className="p-6">
            <h1 className="text-2xl font-bold mb-4">Generate Recipe</h1>
            
            <form onSubmit={handleGenerateRecipe} className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="ingredients" className="text-base">Ingredients</Label>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="use-ingredients"
                      checked={useIngredients}
                      onCheckedChange={setUseIngredients}
                    />
                    <Label htmlFor="use-ingredients" className="text-sm">
                      Use Specific Ingredients
                    </Label>
                  </div>
                </div>
                
                <Input
                  id="ingredients"
                  placeholder={useIngredients ? "Enter ingredients (comma separated)" : "Optional: enter ingredients you'd like to use"}
                  value={ingredients}
                  onChange={(e) => setIngredients(e.target.value)}
                  disabled={isGenerating || !useIngredients}
                />
                
                <p className="text-sm text-muted-foreground">
                  {useIngredients
                    ? "The AI will use these specific ingredients in the recipe"
                    : "The AI will select ingredients for you based on the other criteria"
                  }
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-base flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                    Cooking Time: {cookingTime} minutes
                  </Label>
                </div>
                <Slider
                  value={[cookingTime]}
                  min={15}
                  max={120}
                  step={5}
                  onValueChange={(vals) => setCookingTime(vals[0])}
                  disabled={isGenerating}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>15 mins</span>
                  <span>1 hour</span>
                  <span>2 hours</span>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-base">Recipe Type & Preferences</Label>
                
                {Object.entries(FILTER_CATEGORIES).map(([category, { title, options }]) => (
                  <div key={category} className="space-y-2">
                    <Label className="text-sm font-medium">{title}</Label>
                    <div className="flex flex-wrap gap-2">
                      {options.map(option => (
                        <Button
                          key={option}
                          type="button"
                          size="sm"
                          variant={filters[category]?.includes(option) ? "default" : "outline"}
                          onClick={() => toggleFilter(category, option)}
                          className="rounded-full"
                          disabled={isGenerating}
                        >
                          {option}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="language" className="text-base">Language</Label>
                <Select
                  value={language}
                  onValueChange={setLanguage}
                  disabled={isGenerating}
                >
                  <SelectTrigger id="language">
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
                <p className="text-sm text-muted-foreground">
                  The recipe will be generated in this language
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Recipe...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Generate Recipe
                  </>
                )}
              </Button>
            </form>
          </Card>
        </div>

        {/* Generated Recipe Display */}
        <div>
          {generatedRecipe ? (
            <Card className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">{generatedRecipe.title}</h2>
                <Button onClick={handleSaveRecipe} variant="default">
                  <Save className="mr-2 h-4 w-4" />
                  Save Recipe
                </Button>
              </div>

              <p className="mb-6 text-muted-foreground">{generatedRecipe.description}</p>
              
              <div className="mb-6">
                <ImageGenerator
                  prompt={generatedRecipe.title}
                  onImageGenerated={handleImageSelected}
                  className="mb-4"
                />
                {recipeImage && (
                  <div className="mt-2 text-sm text-muted-foreground text-center">
                    Image will be saved with your recipe
                  </div>
                )}
              </div>

              <div className="flex gap-4 mb-6 text-sm">
                <div className="flex items-center">
                  <Clock className="mr-1 h-4 w-4" />
                  <span>Prep: {generatedRecipe.prep_time || 15} mins</span>
                </div>
                <div className="flex items-center">
                  <Timer className="mr-1 h-4 w-4" />
                  <span>Cook: {generatedRecipe.cook_time || cookingTime} mins</span>
                </div>
                <div className="flex items-center">
                  <Flame className="mr-1 h-4 w-4" />
                  <span>Difficulty: {filters.difficultyLevel[0] || "Medium"}</span>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Ingredients</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {generatedRecipe.ingredients.map((ingredient: string, index: number) => (
                    <li key={index}>{ingredient}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Instructions</h3>
                <ol className="list-decimal pl-5 space-y-3">
                  {generatedRecipe.instructions.map((step: string, index: number) => (
                    <li key={index} className="pl-1">{step}</li>
                  ))}
                </ol>
              </div>
            </Card>
          ) : (
            <Card className="p-6 flex flex-col items-center justify-center min-h-[500px] text-center">
              <RefreshCw className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2">Generate a New Recipe</h3>
              <p className="text-muted-foreground mb-4">
                Fill out the form and click "Generate Recipe" to create a new recipe with AI.
              </p>
              <p className="text-sm text-muted-foreground">
                You can specify ingredients, cooking time, and dietary preferences.
              </p>
            </Card>
          )}
        </div>
      </div>
    </PageLayout>
  );
} 