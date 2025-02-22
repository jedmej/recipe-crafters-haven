import { useState } from 'react';
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import ImageGenerator from "@/components/ImageGenerator";

interface RecipeData {
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  prep_time: number;
  cook_time: number;
  estimated_calories: number;
  suggested_portions: number;
  portion_description: string;
  image_url?: string;
  categories: {
    meal_type: string;
    dietary_restrictions: string[];
    difficulty_level: string;
    cuisine_type: string;
    cooking_method: string[];
  };
}

const LANGUAGE_CODES = {
  'English': 'en',
  'Spanish': 'es',
  'French': 'fr',
  'Italian': 'it',
  'German': 'de',
  'Polish': 'pl'
};

export default function InspirePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedRecipe, setGeneratedRecipe] = useState<RecipeData | null>(null);
  const [mealTypeFilters, setMealTypeFilters] = useState<string[]>([]);
  const [dietaryFilters, setDietaryFilters] = useState<string[]>([]);
  const [difficultyFilters, setDifficultyFilters] = useState<string[]>([]);
  const [cuisineFilters, setCuisineFilters] = useState<string[]>([]);
  const [cookingMethodFilters, setCookingMethodFilters] = useState<string[]>([]);
  const [caloriesRange, setCaloriesRange] = useState<number[]>([0, 2000]);
  const [cookTimeRange, setCookTimeRange] = useState<number[]>([0, 180]);
  const [language, setLanguage] = useState<string>("English");
  const [generateImage, setGenerateImage] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const mealTypes = [
    "Breakfast", "Brunch", "Lunch", "Dinner", "Snacks", "Dessert", "Appetizer"
  ];

  const dietaryRestrictions = [
    "Vegetarian", "Vegan", "Gluten-free", "Dairy-free", 
    "Keto", "Paleo", "Halal", "Kosher"
  ];

  const difficultyLevels = ["Easy", "Medium", "Hard"];

  const cuisineTypes = [
    "Italian", "Asian", "Mexican", "Mediterranean", "American",
    "Indian", "Chinese", "Thai", "Middle Eastern", "Japanese", "French", "Other"
  ];

  const cookingMethods = [
    "Oven-baked", "Stovetop", "Air Fryer", "Slow Cooker",
    "Instant Pot", "Grill", "Sous-vide", "Microwave", "Other"
  ];

  const languages = Object.keys(LANGUAGE_CODES);

  // Helper function to toggle a filter value
  const toggleFilter = (value: string, currentFilters: string[], setFilters: (filters: string[]) => void) => {
    if (value === "all") {
      setFilters([]);
      return;
    }
    
    setFilters(prev => {
      if (prev.includes(value)) {
        return prev.filter(f => f !== value);
      }
      return [...prev, value];
    });
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatCalories = (cal: number) => {
    return `${cal} cal`;
  };

  const generateRecipe = useMutation({
    mutationFn: async () => {
      const preferences = [];
      if (mealTypeFilters.length > 0) preferences.push(`meal type: ${mealTypeFilters.join(", ")}`);
      if (dietaryFilters.length > 0) preferences.push(`dietary restrictions: ${dietaryFilters.join(", ")}`);
      if (difficultyFilters.length > 0) preferences.push(`difficulty level: ${difficultyFilters.join(", ")}`);
      if (cuisineFilters.length > 0) preferences.push(`cuisine type: ${cuisineFilters.join(", ")}`);
      if (cookingMethodFilters.length > 0) preferences.push(`cooking methods: ${cookingMethodFilters.join(", ")}`);
      if (caloriesRange[0]) preferences.push(`maximum calories per serving: ${caloriesRange[0]} - ${caloriesRange[1]}`);
      if (cookTimeRange[0]) preferences.push(`maximum cook time: ${cookTimeRange[0]} - ${cookTimeRange[1]} minutes`);

      const query = `Create a recipe with these preferences: ${preferences.join(", ")}. Make sure to include all applicable dietary restrictions and cooking methods in the response, not just one.`;
      
      const response = await supabase.functions.invoke('recipe-chat', {
        body: { 
          query,
          language: LANGUAGE_CODES[language as keyof typeof LANGUAGE_CODES]
        }
      });

      if (!response.data?.success) {
        throw new Error(response.error?.message || 'Failed to generate recipe');
      }

      let recipeData = response.data.data as RecipeData;
      
      // Ensure categories exist and are arrays
      if (!recipeData.categories) {
        recipeData.categories = {
          meal_type: '',
          dietary_restrictions: [],
          difficulty_level: '',
          cuisine_type: '',
          cooking_method: []
        };
      }

      // Convert string to array if needed for dietary restrictions
      if (typeof recipeData.categories.dietary_restrictions === 'string') {
        recipeData.categories.dietary_restrictions = [recipeData.categories.dietary_restrictions];
      }

      // Convert string to array if needed for cooking method
      if (typeof recipeData.categories.cooking_method === 'string') {
        recipeData.categories.cooking_method = [recipeData.categories.cooking_method];
      }

      // Merge AI-generated categories with user selections
      recipeData.categories = {
        meal_type: mealTypeFilters.length > 0 ? mealTypeFilters[0] : recipeData.categories.meal_type,
        dietary_restrictions: dietaryFilters.length > 0 ? dietaryFilters : 
          (Array.isArray(recipeData.categories.dietary_restrictions) ? 
            recipeData.categories.dietary_restrictions : []),
        difficulty_level: difficultyFilters.length > 0 ? difficultyFilters[0] : recipeData.categories.difficulty_level,
        cuisine_type: cuisineFilters.length > 0 ? cuisineFilters[0] : recipeData.categories.cuisine_type,
        cooking_method: cookingMethodFilters.length > 0 ? cookingMethodFilters :
          (Array.isArray(recipeData.categories.cooking_method) ? 
            recipeData.categories.cooking_method : [])
      };

      // Ensure all category arrays are properly initialized and non-empty
      if (!Array.isArray(recipeData.categories.dietary_restrictions) || recipeData.categories.dietary_restrictions.length === 0) {
        // If no dietary restrictions are specified, check the recipe description and ingredients for common indicators
        const commonDietary = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free'];
        const lowerDesc = recipeData.description.toLowerCase();
        const lowerIngredients = recipeData.ingredients.join(' ').toLowerCase();
        recipeData.categories.dietary_restrictions = commonDietary.filter(diet => 
          lowerDesc.includes(diet) || lowerIngredients.includes(diet)
        );
      }

      if (!Array.isArray(recipeData.categories.cooking_method) || recipeData.categories.cooking_method.length === 0) {
        // If no cooking methods are specified, check the instructions for common cooking methods
        const commonMethods = ['baked', 'grilled', 'fried', 'steamed', 'boiled', 'roasted'];
        const lowerInstructions = recipeData.instructions.join(' ').toLowerCase();
        recipeData.categories.cooking_method = commonMethods.filter(method => 
          lowerInstructions.includes(method)
        );
      }

      // Convert all category values to proper case for display
      recipeData.categories.meal_type = recipeData.categories.meal_type.charAt(0).toUpperCase() + 
        recipeData.categories.meal_type.slice(1).toLowerCase();
      recipeData.categories.difficulty_level = recipeData.categories.difficulty_level.charAt(0).toUpperCase() + 
        recipeData.categories.difficulty_level.slice(1).toLowerCase();
      recipeData.categories.cuisine_type = recipeData.categories.cuisine_type.charAt(0).toUpperCase() + 
        recipeData.categories.cuisine_type.slice(1).toLowerCase();
      recipeData.categories.dietary_restrictions = recipeData.categories.dietary_restrictions.map(
        r => r.charAt(0).toUpperCase() + r.slice(1).toLowerCase()
      );
      recipeData.categories.cooking_method = recipeData.categories.cooking_method.map(
        m => m.charAt(0).toUpperCase() + m.slice(1).toLowerCase()
      );

      // Remove duplicates from arrays
      recipeData.categories.dietary_restrictions = [...new Set(recipeData.categories.dietary_restrictions)];
      recipeData.categories.cooking_method = [...new Set(recipeData.categories.cooking_method)];

      console.log('Recipe generated:', recipeData);

      // Generate image if enabled
      if (generateImage) {
        console.log('Image generation enabled, starting process...');
        try {
          let imagePrompt;
          // If the recipe is not in English, get an English version for better image generation
          if (language !== 'English') {
            console.log('Non-English recipe, getting English version for image prompt...');
            const englishResponse = await supabase.functions.invoke('recipe-chat', {
              body: { 
                query,
                language: 'en'
              }
            });
            
            if (englishResponse.data?.success && englishResponse.data?.data) {
              imagePrompt = `${englishResponse.data.data.title}: ${englishResponse.data.data.description}`;
            } else {
              console.log('Failed to get English version, using original language for prompt');
              imagePrompt = `${recipeData.title}: ${recipeData.description}`;
            }
          } else {
            imagePrompt = `${recipeData.title}: ${recipeData.description}`;
          }

          setIsGeneratingImage(true);
        } catch (error) {
          console.error('Error generating image:', error);
          toast({
            title: "Warning",
            description: "Recipe was generated but image generation failed. You can try regenerating later.",
            variant: "destructive",
          });
        }
      }

      return recipeData;
    },
    onSuccess: (recipeData) => {
      console.log('Setting generated recipe:', recipeData);
      setGeneratedRecipe(recipeData);
      toast({
        title: "Recipe generated",
        description: "Review the recipe and save it if you like it!",
      });
    },
    onError: (error: Error) => {
      console.error('Recipe generation error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to generate recipe. Please try again.",
      });
    }
  });

  const saveRecipe = async () => {
    if (!generatedRecipe) return;

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data: savedRecipe, error: saveError } = await supabase
        .from('recipes')
        .insert([{
          title: generatedRecipe.title,
          description: generatedRecipe.description,
          ingredients: generatedRecipe.ingredients,
          instructions: generatedRecipe.instructions,
          prep_time: generatedRecipe.prep_time,
          cook_time: generatedRecipe.cook_time,
          estimated_calories: generatedRecipe.estimated_calories,
          servings: generatedRecipe.suggested_portions,
          suggested_portions: generatedRecipe.suggested_portions,
          portion_size: generatedRecipe.suggested_portions,
          portion_description: generatedRecipe.portion_description,
          user_id: user.id,
          created_at: new Date().toISOString(),
          language: LANGUAGE_CODES[language as keyof typeof LANGUAGE_CODES],
          image_url: generatedRecipe.image_url,
          categories: {
            meal_type: generatedRecipe.categories.meal_type,
            dietary_restrictions: generatedRecipe.categories.dietary_restrictions,
            difficulty_level: generatedRecipe.categories.difficulty_level,
            cuisine_type: generatedRecipe.categories.cuisine_type,
            cooking_method: generatedRecipe.categories.cooking_method
          }
        }])
        .select()
        .single();

      if (saveError) throw saveError;

      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      navigate(`/recipes/${savedRecipe.id}`);
      toast({
        title: "Recipe saved",
        description: "Your recipe has been saved to your collection.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save recipe. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInspire = async () => {
    setIsGenerating(true);
    try {
      await generateRecipe.mutateAsync();
    } catch (error) {
      console.error('Error in handleInspire:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 md:px-6 lg:px-8">
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-gray-100 transition-colors -ml-2"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            <span className="text-sm">Back</span>
          </Button>
        </div>

        <div className="w-full max-w-3xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900">Get Inspired</h1>
            <p className="mt-3 text-lg text-gray-500">
              Choose your preferences and let AI suggest the perfect recipe for you
            </p>
          </div>

          <Card className="bg-white shadow-sm rounded-2xl border-none">
            <div className="p-6 space-y-8">
              <div className="space-y-8">
                {/* Meal Type */}
                <div>
                  <h3 className="font-medium text-sm text-gray-500 mb-3">Meal Type</h3>
                  <div className="flex flex-wrap gap-2">
                    {mealTypes.map((type) => (
                      <Button
                        key={type}
                        variant={mealTypeFilters.includes(type.toLowerCase()) ? "default" : "outline"}
                        size="sm"
                        className="rounded-full h-8"
                        onClick={() => toggleFilter(type.toLowerCase(), mealTypeFilters, setMealTypeFilters)}
                      >
                        {type}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Dietary Restrictions */}
                <div>
                  <h3 className="font-medium text-sm text-gray-500 mb-3">Dietary Restrictions</h3>
                  <div className="flex flex-wrap gap-2">
                    {dietaryRestrictions.map((restriction) => (
                      <Button
                        key={restriction}
                        variant={dietaryFilters.includes(restriction.toLowerCase()) ? "default" : "outline"}
                        size="sm"
                        className="rounded-full h-8"
                        onClick={() => toggleFilter(restriction.toLowerCase(), dietaryFilters, setDietaryFilters)}
                      >
                        {restriction}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Difficulty Level */}
                <div>
                  <h3 className="font-medium text-sm text-gray-500 mb-3">Difficulty Level</h3>
                  <div className="flex flex-wrap gap-2">
                    {difficultyLevels.map((level) => (
                      <Button
                        key={level}
                        variant={difficultyFilters.includes(level.toLowerCase()) ? "default" : "outline"}
                        size="sm"
                        className="rounded-full h-8"
                        onClick={() => toggleFilter(level.toLowerCase(), difficultyFilters, setDifficultyFilters)}
                      >
                        {level}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Cuisine Type */}
                <div>
                  <h3 className="font-medium text-sm text-gray-500 mb-3">Cuisine Type</h3>
                  <div className="flex flex-wrap gap-2">
                    {cuisineTypes.map((type) => (
                      <Button
                        key={type}
                        variant={cuisineFilters.includes(type.toLowerCase()) ? "default" : "outline"}
                        size="sm"
                        className="rounded-full h-8"
                        onClick={() => toggleFilter(type.toLowerCase(), cuisineFilters, setCuisineFilters)}
                      >
                        {type}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Cooking Method */}
                <div>
                  <h3 className="font-medium text-sm text-gray-500 mb-3">Cooking Method</h3>
                  <div className="flex flex-wrap gap-2">
                    {cookingMethods.map((method) => (
                      <Button
                        key={method}
                        variant={cookingMethodFilters.includes(method.toLowerCase()) ? "default" : "outline"}
                        size="sm"
                        className="rounded-full h-8"
                        onClick={() => toggleFilter(method.toLowerCase(), cookingMethodFilters, setCookingMethodFilters)}
                      >
                        {method}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Time Range Slider */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-gray-500">Total Time</Label>
                    <span className="text-sm text-gray-500">
                      {formatTime(cookTimeRange[0])} - {formatTime(cookTimeRange[1])}
                    </span>
                  </div>
                  <div className="pt-2 px-3">
                    <div className="relative">
                      <div className="absolute inset-x-0 h-2 bg-gray-100 rounded-full" />
                      <div
                        className="absolute h-2 bg-gray-900 rounded-full"
                        style={{
                          left: `${(cookTimeRange[0] / 180) * 100}%`,
                          right: `${100 - (cookTimeRange[1] / 180) * 100}%`
                        }}
                      />
                      <Slider
                        min={0}
                        max={180}
                        step={5}
                        value={cookTimeRange}
                        onValueChange={setCookTimeRange}
                        className="relative w-full"
                        thumbClassName="block h-7 w-7 rounded-full border-2 border-gray-900 bg-white shadow-md hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 cursor-grab active:cursor-grabbing"
                      />
                    </div>
                  </div>
                </div>

                {/* Calories Range Slider */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-gray-500">Calories per Serving</Label>
                    <span className="text-sm text-gray-500">
                      {formatCalories(caloriesRange[0])} - {formatCalories(caloriesRange[1])}
                    </span>
                  </div>
                  <div className="pt-2 px-3">
                    <div className="relative">
                      <div className="absolute inset-x-0 h-2 bg-gray-100 rounded-full" />
                      <div
                        className="absolute h-2 bg-gray-900 rounded-full"
                        style={{
                          left: `${(caloriesRange[0] / 2000) * 100}%`,
                          right: `${100 - (caloriesRange[1] / 2000) * 100}%`
                        }}
                      />
                      <Slider
                        min={0}
                        max={2000}
                        step={50}
                        value={caloriesRange}
                        onValueChange={setCaloriesRange}
                        className="relative w-full"
                        thumbClassName="block h-7 w-7 rounded-full border-2 border-gray-900 bg-white shadow-md hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 cursor-grab active:cursor-grabbing"
                      />
                    </div>
                  </div>
                </div>

                {/* Language Selection */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-500">Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="w-full h-12 rounded-xl bg-white border-gray-200">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang} value={lang}>
                          {lang}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Image Generation Toggle */}
                <div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="generate-image"
                      checked={generateImage}
                      onCheckedChange={setGenerateImage}
                      disabled={isGenerating || isGeneratingImage}
                      className="data-[state=checked]:bg-gray-900"
                    />
                    <Label htmlFor="generate-image" className="text-sm font-medium text-gray-700">
                      Generate AI image for recipe
                    </Label>
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <div className="pt-4">
                <Button 
                  className="w-full h-14 text-base rounded-xl bg-gray-900 hover:bg-gray-800"
                  onClick={handleInspire}
                  disabled={isGenerating || isGeneratingImage || isSaving}
                >
                  {isGenerating || isGeneratingImage ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {isGeneratingImage ? 'Generating Image...' : 'Generating Recipe...'}
                    </>
                  ) : (
                    'Get Recipe Suggestion'
                  )}
                </Button>
              </div>
            </div>
          </Card>

          {generatedRecipe && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
              <div className="lg:col-span-8">
                <Card className="overflow-hidden border-none shadow-sm rounded-2xl">
                  <div className="p-6 lg:p-8">
                    <div className="flex justify-end gap-4 mb-6">
                      <Button
                        className="flex-1 sm:flex-initial h-12 rounded-xl bg-gray-900 hover:bg-gray-800"
                        onClick={saveRecipe}
                        disabled={isSaving || isGenerating || isGeneratingImage}
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-5 w-5" />
                            Save Recipe
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        className="h-12 rounded-xl border-gray-200"
                        onClick={handleInspire}
                        disabled={isGenerating || isGeneratingImage || isSaving}
                      >
                        <RefreshCw className="mr-2 h-5 w-5" />
                        Regenerate
                      </Button>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">{generatedRecipe.title}</h1>
                        <p className="text-gray-600 mt-4 text-lg">{generatedRecipe.description}</p>
                        
                        {/* Categories/Tags Display */}
                        <div className="mt-6 space-y-4">
                          <div className="flex flex-wrap gap-2">
                            {/* Meal Type */}
                            {generatedRecipe.categories?.meal_type && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                {generatedRecipe.categories.meal_type}
                              </span>
                            )}
                            
                            {/* Dietary Restrictions */}
                            {generatedRecipe.categories?.dietary_restrictions?.map((restriction, index) => (
                              <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                {restriction}
                              </span>
                            ))}
                            
                            {/* Difficulty Level */}
                            {generatedRecipe.categories?.difficulty_level && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                                {generatedRecipe.categories.difficulty_level}
                              </span>
                            )}
                            
                            {/* Cuisine Type */}
                            {generatedRecipe.categories?.cuisine_type && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                                {generatedRecipe.categories.cuisine_type}
                              </span>
                            )}
                            
                            {/* Cooking Methods */}
                            {generatedRecipe.categories?.cooking_method?.map((method, index) => (
                              <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                                {method}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      {generatedRecipe.image_url && (
                        <div className="relative w-full h-[500px] rounded-xl overflow-hidden">
                          <img
                            src={generatedRecipe.image_url}
                            alt={generatedRecipe.title}
                            className="object-cover w-full h-full"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </div>

              <div className="lg:col-span-4">
                <Card className="border-none shadow-sm rounded-2xl">
                  <div className="p-6">
                    <div className="grid grid-cols-3 lg:grid-cols-1 gap-4">
                      <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl">
                        <Clock className="h-6 w-6 text-gray-500 mb-2" />
                        <p className="text-sm text-gray-500">Prep Time</p>
                        <p className="text-lg font-semibold">{generatedRecipe.prep_time} min</p>
                      </div>
                      <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl">
                        <Timer className="h-6 w-6 text-gray-500 mb-2" />
                        <p className="text-sm text-gray-500">Cook Time</p>
                        <p className="text-lg font-semibold">{generatedRecipe.cook_time} min</p>
                      </div>
                      <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl">
                        <Flame className="h-6 w-6 text-gray-500 mb-2" />
                        <p className="text-sm text-gray-500">Calories</p>
                        <p className="text-lg font-semibold">{generatedRecipe.estimated_calories} kcal</p>
                      </div>
                      <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-500">Portions</p>
                        <p className="text-lg font-semibold">{generatedRecipe.suggested_portions} {generatedRecipe.portion_description}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="lg:col-span-6">
                <Card className="h-full border-none shadow-sm rounded-2xl">
                  <div className="p-6 lg:p-8">
                    <h3 className="text-2xl font-semibold mb-6">Ingredients</h3>
                    <ul className="list-none space-y-4">
                      {generatedRecipe.ingredients.map((ingredient, index) => (
                        <li key={index} className="flex items-center gap-4">
                          <span className="w-2 h-2 rounded-full bg-gray-500 flex-shrink-0" />
                          <span className="text-gray-700">{ingredient}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              </div>

              <div className="lg:col-span-6">
                <Card className="h-full border-none shadow-sm rounded-2xl">
                  <div className="p-6 lg:p-8">
                    <h3 className="text-2xl font-semibold mb-6">Instructions</h3>
                    <div className="space-y-4">
                      {generatedRecipe.instructions.map((instruction, index) => (
                        <div key={index} className="flex items-start gap-4 text-lg text-gray-700">
                          <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-700 font-medium">
                            {index + 1}
                          </span>
                          <span>{instruction}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {generateImage && generatedRecipe && !generatedRecipe.image_url && (
            <ImageGenerator
              prompt={`${generatedRecipe.title}: ${generatedRecipe.description}`}
              embedded={true}
              onImageGenerated={(imageUrl) => {
                setGeneratedRecipe(prev => prev ? { ...prev, image_url: imageUrl } : null);
                setIsGeneratingImage(false);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
} 