import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2, Save, RefreshCw, Clock, Timer, Flame, ArrowLeft, Tags, ListPlus } from "lucide-react";
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
  
  // State for recipe detail view (similar to RecipeDetailPage)
  const [desiredServings, setDesiredServings] = useState(4);
  const [measurementSystem, setMeasurementSystem] = useState(preferences.measurementSystem || 'metric');
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
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("User not authenticated");

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
        categoryFilters: categoryFilters, // Add structured category data
        measurementSystem: measurementSystem,
        useIngredients: useIngredients,
        generateAllCategories: true // Signal to the AI to generate all category fields
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

      // Log the data we're sending to Supabase
      console.log('Sending to Supabase:', recipeToSave);

      // Save to database
      const { data, error } = await supabase
        .from('recipes')
        .insert([recipeToSave])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
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

  // Handle image upload/generation
  const handleImageSelected = (imageUrl: string) => {
    setRecipeImage(imageUrl);
  };

  // Similar to RecipeDetailPage functions
  const handleServingsChange = (newServings: number) => {
    setDesiredServings(newServings);
  };

  const toggleMeasurementSystem = () => {
    const newSystem = measurementSystem === 'metric' ? 'imperial' : 'metric';
    setMeasurementSystem(newSystem);
  };

  const calculateCaloriesPerServing = (totalCalories: number, totalServings: number) => {
    if (!totalCalories || !totalServings) return 0;
    return totalCalories / totalServings;
  };

  const addToGroceryList = () => {
    toast({
      title: "Feature not available",
      description: "Adding to grocery list is not available for generated recipes until saved.",
    });
  };

  // Calculate scale factor for ingredients
  const scaleFactor = generatedRecipe && generatedRecipe.servings 
    ? desiredServings / generatedRecipe.servings 
    : 1;

  // If we're still loading or there's no recipe data yet, show the form
  if (isGenerating) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If we don't have a generated recipe yet, show the generation form
  if (!generatedRecipe) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <Button
            variant="ghost"
            className="mb-8"
            onClick={() => navigate('/recipes')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Recipes
          </Button>

          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Recipe Inspiration</h1>
              <p className="text-muted-foreground mt-2">
                Generate a new recipe based on your preferences
              </p>
            </div>

            <form onSubmit={handleGenerateRecipe} className="space-y-8">
              {/* Ingredient Input */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Switch 
                    id="use-ingredients"
                    checked={useIngredients}
                    onCheckedChange={setUseIngredients}
                  />
                  <Label htmlFor="use-ingredients">Use specific ingredients</Label>
                </div>
                
                {useIngredients && (
                  <div className="space-y-2">
                    <Label htmlFor="ingredients">Ingredients (comma separated)</Label>
                    <Input
                      id="ingredients"
                      placeholder="e.g. chicken, rice, bell peppers"
                      value={ingredients}
                      onChange={(e) => setIngredients(e.target.value)}
                      disabled={isGenerating}
                    />
                  </div>
                )}
              </div>

              {/* Cooking Time Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="cooking-time">Cooking Time: {cookingTime} minutes</Label>
                </div>
                <Slider
                  id="cooking-time"
                  min={5}
                  max={120}
                  step={5}
                  value={[cookingTime]}
                  onValueChange={(values) => setCookingTime(values[0])}
                  disabled={isGenerating}
                />
              </div>

              {/* Filter Categories */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Recipe Filters</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(FILTER_CATEGORIES).map(([category, { title, options }]) => (
                    <div key={category} className="space-y-2">
                      <Label>{title}</Label>
                      <div className="flex flex-wrap gap-2">
                        {options.map(option => (
                          <button
                            key={option}
                            type="button"
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              filters[category]?.includes(option)
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                            }`}
                            onClick={() => toggleFilter(category, option)}
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

              {/* Language Selection */}
              <div className="space-y-2">
                <Label htmlFor="language">Recipe Language</Label>
                <Select
                  value={language}
                  onValueChange={setLanguage}
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

              <Button
                type="submit"
                className="w-full md:w-auto"
                disabled={isGenerating}
              >
                {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Recipe
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // If we have a generated recipe, show it in the same format as RecipeDetail
  const recipe = generatedRecipe.data || generatedRecipe;
  
  // Ensure we have category values for display
  const displayCategories = {
    meal_type: recipe.categories?.meal_type || filters.mealType?.[0] || "Main Dish",
    dietary_restrictions: recipe.categories?.dietary_restrictions || filters.dietaryRestrictions?.[0] || "Regular",
    difficulty_level: recipe.categories?.difficulty_level || filters.difficultyLevel?.[0] || "Medium",
    cuisine_type: recipe.categories?.cuisine_type || filters.cuisineType?.[0] || "International",
    cooking_method: recipe.categories?.cooking_method || "Various"
  };
  
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <Button
          variant="ghost"
          className="mb-8"
          onClick={() => navigate('/recipes')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Recipes
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          <div className="lg:col-span-8">
            <Card className="overflow-hidden">
              <CardContent className="p-6 lg:p-8">
                <div className="space-y-6">
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">{recipe.title}</h1>
                    <p className="text-gray-600 mt-4 text-lg">{recipe.description}</p>
                    
                    {/* Categories/Tags Section - Updated to show all tags */}
                    <div className="space-y-4 mt-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <Tags className="h-4 w-4" />
                            Meal Type
                          </label>
                          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                            {displayCategories.meal_type}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <Tags className="h-4 w-4" />
                            Dietary Restrictions
                          </label>
                          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                            {displayCategories.dietary_restrictions}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <Tags className="h-4 w-4" />
                            Difficulty Level
                          </label>
                          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                            {displayCategories.difficulty_level}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <Tags className="h-4 w-4" />
                            Cuisine Type
                          </label>
                          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                            {displayCategories.cuisine_type}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <Tags className="h-4 w-4" />
                            Cooking Method
                          </label>
                          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                            {displayCategories.cooking_method}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Recipe Image */}
                  {recipeImage ? (
                    <div className="relative w-full h-[500px] rounded-xl overflow-hidden">
                      <img
                        src={recipeImage}
                        alt={recipe.title}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center rounded-xl overflow-hidden bg-gray-50">
                      <ImageUploadOrGenerate
                        onImageSelected={handleImageSelected}
                        title={recipe.title}
                        disabled={isGeneratingImage}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Recipe Actions Card */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Recipe Actions</h3>
                  
                  <div className="flex flex-col space-y-3">
                    <Button 
                      onClick={handleSaveRecipe} 
                      className="w-full"
                      disabled={saveRecipe.isLoading}
                    >
                      {saveRecipe.isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Save Recipe
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setGeneratedRecipe(null);
                        setRecipeImage(null);
                      }}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      New Recipe
                    </Button>
                    
                    <div className="flex items-center space-x-2 mt-2">
                      <div className="grid h-5 w-5 place-items-center">
                        <span className={measurementSystem === 'metric' ? 'font-bold' : ''}>M</span>
                      </div>
                      <Switch
                        checked={measurementSystem === 'imperial'}
                        onCheckedChange={toggleMeasurementSystem}
                      />
                      <div className="grid h-5 w-5 place-items-center">
                        <span className={measurementSystem === 'imperial' ? 'font-bold' : ''}>I</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recipe Info Card */}
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-3 lg:grid-cols-1 gap-4">
                  <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
                    <Clock className="h-6 w-6 text-gray-500 mb-2" />
                    <p className="text-sm text-gray-500">Prep Time</p>
                    <p className="text-lg font-semibold">{recipe.prep_time || "10"} min</p>
                  </div>
                  <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
                    <Timer className="h-6 w-6 text-gray-500 mb-2" />
                    <p className="text-sm text-gray-500">Cook Time</p>
                    <p className="text-lg font-semibold">{recipe.cook_time || cookingTime} min</p>
                  </div>
                  <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
                    <Flame className="h-6 w-6 text-gray-500 mb-2" />
                    <p className="text-sm text-gray-500">Calories</p>
                    <p className="text-lg font-semibold">
                      {Math.round(calculateCaloriesPerServing(recipe.estimated_calories || 0, recipe.servings || 4) * scaleFactor)} kcal
                    </p>
                  </div>
                  <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Servings</p>
                    <p className="text-lg font-semibold">
                      {recipe.servings || recipe.suggested_portions || 4} {recipe.portion_description || "servings"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-6">
            <Card className="h-full">
              <CardContent className="p-6 lg:p-8">
                <h3 className="text-2xl font-semibold mb-6">Ingredients</h3>
                {/* Ingredients Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Label htmlFor="servings-input">Adjust servings:</Label>
                    <Input
                      id="servings-input"
                      type="number"
                      min="1"
                      max="100"
                      value={desiredServings}
                      onChange={(e) => handleServingsChange(parseInt(e.target.value) || 1)}
                      className="w-20"
                    />
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => addToGroceryList()}
                      className="ml-auto"
                    >
                      <ListPlus className="h-4 w-4 mr-2" />
                      Add to Grocery List
                    </Button>
                  </div>
                  
                  <ul className="space-y-3">
                    {recipe.ingredients?.map((ingredient: any, idx: number) => (
                      <li key={idx} className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-primary"></div>
                        {typeof ingredient === 'string' ? (
                          <span>{ingredient}</span>
                        ) : (
                          <span>
                            {ingredient.quantity && (
                              <span className="font-medium">
                                {Math.round((ingredient.quantity * scaleFactor) * 100) / 100} {ingredient.unit}{' '}
                              </span>
                            )}
                            {ingredient.name}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-6">
            <Card className="h-full">
              <CardContent className="p-6 lg:p-8">
                <h3 className="text-2xl font-semibold mb-6">Instructions</h3>
                <div className="space-y-4">
                  {recipe.instructions?.map((instruction: string, index: number) => (
                    <div key={index} className="flex items-start gap-4 text-lg text-gray-700">
                      <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-700 font-medium">
                        {index + 1}
                      </span>
                      <span>{instruction}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 