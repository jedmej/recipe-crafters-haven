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
import { RecipePageLayout } from "@/components/layout/RecipePageLayout";

// Types and constants
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
    options: ["Italian", "Asian", "Mexican", "Mediterranean", "American", "Indian", "Chinese", "Thai", "Middle Eastern", "Japanese", "French", "Other"],
    badgeClass: "bg-purple-100 text-purple-800"
  },
  cookingMethod: {
    title: "Cooking Method",
    options: ["Oven-baked", "Stovetop", "Air Fryer", "Slow Cooker", "Instant Pot", "Grill", "Sous-vide", "Microwave", "Other"],
    badgeClass: "bg-red-100 text-red-800"
  }
};

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

interface FilterState {
  mealTypeFilters: string[];
  dietaryFilters: string[];
  difficultyFilters: string[];
  cuisineFilters: string[];
  cookingMethodFilters: string[];
  caloriesRange: number[];
  cookTimeRange: number[];
  keywords: string;
  language: string;
  generateImage: boolean;
}

// Helper Components
const FilterButtons = ({ title, options, selected, onChange }: { 
  title: string; 
  options: string[]; 
  selected: string[] | undefined; 
  onChange: (value: string) => void;
}) => (
  <div>
    <h3 className="font-medium text-sm text-gray-500 mb-3">{title}</h3>
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <Button
          key={option}
          variant={selected?.includes(option.toLowerCase()) ? "default" : "outline"}
          size="sm"
          className="rounded-full h-8"
          onClick={() => onChange(option.toLowerCase())}
        >
          {option}
        </Button>
      ))}
    </div>
  </div>
);

const RecipeMetric = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl">
    <Icon className="h-6 w-6 text-gray-500 mb-2" />
    <p className="text-sm text-gray-500">{label}</p>
    <p className="text-lg font-semibold">{value}</p>
  </div>
);

const RecipeIngredients = ({ ingredients }: { ingredients: string[] }) => (
  <Card className="h-full border-none shadow-sm rounded-2xl">
    <div className="p-6 lg:p-8">
      <h3 className="text-2xl font-semibold mb-6">Ingredients</h3>
      <ul className="list-none space-y-4">
        {ingredients.map((ingredient, index) => (
          <li key={index} className="flex items-center gap-4">
            <span className="w-2 h-2 rounded-full bg-gray-500 flex-shrink-0" />
            <span className="text-gray-700">{ingredient}</span>
          </li>
        ))}
      </ul>
    </div>
  </Card>
);

const RecipeInstructions = ({ instructions }: { instructions: string[] }) => (
  <Card className="h-full border-none shadow-sm rounded-2xl">
    <div className="p-6 lg:p-8">
      <h3 className="text-2xl font-semibold mb-6">Instructions</h3>
      <div className="space-y-4">
        {instructions.map((instruction, index) => (
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
);

// Utility functions
const formatTime = (minutes: number) => 
  minutes < 60 ? `${minutes}m` : `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}m` : ''}`;

const formatCalories = (cal: number) => `${cal} cal`;

const toggleFilter = (value: string, currentFilters: string[]) => {
  if (value === "all") return [];
  return currentFilters.includes(value) 
    ? currentFilters.filter(f => f !== value) 
    : [...currentFilters, value];
};

// Main component
export default function InspirePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { preferences } = useUserPreferences();
  
  // Process and UI states
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedRecipe, setGeneratedRecipe] = useState<RecipeData | null>(null);
  
  // Filter states
  const [filterState, setFilterState] = useState<FilterState>({
    mealTypeFilters: [],
    dietaryFilters: [],
    difficultyFilters: [],
    cuisineFilters: [],
    cookingMethodFilters: [],
    caloriesRange: [0, 2000],
    cookTimeRange: [0, 180],
    keywords: "",
    language: LANGUAGE_NAMES[preferences.language] || "English",
    generateImage: false
  });

  // Update language when user preferences change
  useEffect(() => {
    setFilterState(prev => ({
      ...prev,
      language: LANGUAGE_NAMES[preferences.language] || "English"
    }));
  }, [preferences.language]);

  // Filter update handlers
  const updateFilter = (type: keyof FilterState, value: any) => {
    setFilterState(prev => ({ ...prev, [type]: value }));
  };

  const updateFilterByToggle = (type: keyof FilterState, value: string) => {
    setFilterState(prev => ({
      ...prev,
      [type]: toggleFilter(value, prev[type] as string[])
    }));
  };

  // Helper function to safely get filter array from state
  const getFilterArray = (key: string): string[] => {
    const filterKey = `${key}Filters` as keyof FilterState;
    return (filterState[filterKey] as string[]) || [];
  };

  // Recipe generation mutation
  const generateRecipe = useMutation({
    mutationFn: async () => {
      const { 
        mealTypeFilters, dietaryFilters, difficultyFilters, 
        cuisineFilters, cookingMethodFilters, caloriesRange, 
        cookTimeRange, keywords, language, generateImage 
      } = filterState;
      
      // Build preferences array
      const preferences = [];
      if (mealTypeFilters.length > 0) preferences.push(`meal type: ${mealTypeFilters.join(", ")}`);
      if (dietaryFilters.length > 0) preferences.push(`dietary restrictions: ${dietaryFilters.join(", ")}`);
      if (difficultyFilters.length > 0) preferences.push(`difficulty level: ${difficultyFilters.join(", ")}`);
      if (cuisineFilters.length > 0) preferences.push(`cuisine type: ${cuisineFilters.join(", ")}`);
      if (cookingMethodFilters.length > 0) preferences.push(`cooking methods: ${cookingMethodFilters.join(", ")}`);
      if (caloriesRange[0]) preferences.push(`maximum calories per serving: ${caloriesRange[0]} - ${caloriesRange[1]}`);
      if (cookTimeRange[0]) preferences.push(`maximum cook time: ${cookTimeRange[0]} - ${cookTimeRange[1]} minutes`);
      
      // Add keywords to preferences if provided
      if (keywords.trim()) {
        const keywordsList = keywords.split(',').map(kw => kw.trim()).filter(kw => kw);
        if (keywordsList.length > 0) {
          preferences.push(`additional preferences: ${keywordsList.join(", ")}`);
        }
      }

      const query = `Create a recipe with these preferences: ${preferences.join(", ")}. Make sure to include all applicable dietary restrictions and cooking methods in the response, not just one.`;
      
      const response = await supabase.functions.invoke('recipe-chat', {
        body: { 
          query,
          language: LANGUAGE_CODES[language as keyof typeof LANGUAGE_CODES],
          measurementSystem: preferences.measurementSystem
        }
      });

      if (!response.data?.success) {
        throw new Error(response.error?.message || 'Failed to generate recipe');
      }

      // Process recipe data
      let recipeData = response.data.data as RecipeData;
      
      // Ensure categories exist and are properly formatted
      recipeData.categories = {
        meal_type: mealTypeFilters.length > 0 ? mealTypeFilters[0] : recipeData.categories?.meal_type || '',
        dietary_restrictions: dietaryFilters.length > 0 ? dietaryFilters : 
          (Array.isArray(recipeData.categories?.dietary_restrictions) ? 
            recipeData.categories.dietary_restrictions : []),
        difficulty_level: difficultyFilters.length > 0 ? difficultyFilters[0] : recipeData.categories?.difficulty_level || '',
        cuisine_type: cuisineFilters.length > 0 ? cuisineFilters[0] : recipeData.categories?.cuisine_type || '',
        cooking_method: cookingMethodFilters.length > 0 ? cookingMethodFilters :
          (Array.isArray(recipeData.categories?.cooking_method) ? 
            recipeData.categories.cooking_method : [])
      };

      // Infer categories if not specified
      if (!recipeData.categories.dietary_restrictions.length) {
        const commonDietary = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free'];
        const lowerDesc = recipeData.description.toLowerCase();
        const lowerIngredients = recipeData.ingredients.join(' ').toLowerCase();
        recipeData.categories.dietary_restrictions = commonDietary.filter(diet => 
          lowerDesc.includes(diet) || lowerIngredients.includes(diet)
        );
      }

      if (!recipeData.categories.cooking_method.length) {
        const commonMethods = ['baked', 'grilled', 'fried', 'steamed', 'boiled', 'roasted'];
        const lowerInstructions = recipeData.instructions.join(' ').toLowerCase();
        recipeData.categories.cooking_method = commonMethods.filter(method => 
          lowerInstructions.includes(method)
        );
      }

      // Format and clean categories
      const formatCategory = (str: string) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
      
      recipeData.categories.meal_type = formatCategory(recipeData.categories.meal_type);
      recipeData.categories.difficulty_level = formatCategory(recipeData.categories.difficulty_level);
      recipeData.categories.cuisine_type = formatCategory(recipeData.categories.cuisine_type);
      recipeData.categories.dietary_restrictions = [...new Set(recipeData.categories.dietary_restrictions.map(formatCategory))];
      recipeData.categories.cooking_method = [...new Set(recipeData.categories.cooking_method.map(formatCategory))];

      // Start image generation if enabled
      if (generateImage) {
        try {
          let imagePrompt;
          if (language !== 'English') {
            const englishResponse = await supabase.functions.invoke('recipe-chat', {
              body: { 
                query,
                language: 'en',
                measurementSystem: preferences.measurementSystem
              }
            });
            
            imagePrompt = englishResponse.data?.success ? 
              `${englishResponse.data.data.title}: ${englishResponse.data.data.description}` : 
              `${recipeData.title}: ${recipeData.description}`;
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

  // Save recipe function
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
          language: LANGUAGE_CODES[filterState.language as keyof typeof LANGUAGE_CODES],
          image_url: generatedRecipe.image_url,
          categories: generatedRecipe.categories
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

  // Generate recipe handler
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
    <RecipePageLayout>
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">Get Inspired</h1>
        <p className="mt-3 text-lg text-gray-500">
          Choose your preferences and let AI suggest the perfect recipe for you
        </p>
      </div>

      <Card className="bg-white shadow-sm rounded-2xl border-none">
        <div className="p-6 space-y-8">
          <div className="space-y-8">
            {/* Filter sections dynamically generated */}
            {Object.entries(FILTER_CATEGORIES).map(([key, category]) => (
              <FilterButtons
                key={key}
                title={category.title}
                options={category.options}
                selected={getFilterArray(key)}
                onChange={(value) => updateFilterByToggle(`${key}Filters` as keyof FilterState, value)}
              />
            ))}

            {/* Time Range Slider */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-500">Total Time</Label>
                <span className="text-sm text-gray-500">
                  {formatTime(filterState.cookTimeRange[0])} - {formatTime(filterState.cookTimeRange[1])}
                </span>
              </div>
              <div className="pt-2 px-3">
                <div className="relative">
                  <div className="absolute inset-x-0 h-2 bg-gray-100 rounded-full" />
                  <div
                    className="absolute h-2 bg-gray-900 rounded-full"
                    style={{
                      left: `${(filterState.cookTimeRange[0] / 180) * 100}%`,
                      right: `${100 - (filterState.cookTimeRange[1] / 180) * 100}%`
                    }}
                  />
                  <Slider
                    min={0}
                    max={180}
                    step={5}
                    value={filterState.cookTimeRange}
                    onValueChange={(value) => updateFilter('cookTimeRange', value)}
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
                  {formatCalories(filterState.caloriesRange[0])} - {formatCalories(filterState.caloriesRange[1])}
                </span>
              </div>
              <div className="pt-2 px-3">
                <div className="relative">
                  <div className="absolute inset-x-0 h-2 bg-gray-100 rounded-full" />
                  <div
                    className="absolute h-2 bg-gray-900 rounded-full"
                    style={{
                      left: `${(filterState.caloriesRange[0] / 2000) * 100}%`,
                      right: `${100 - (filterState.caloriesRange[1] / 2000) * 100}%`
                    }}
                  />
                  <Slider
                    min={0}
                    max={2000}
                    step={50}
                    value={filterState.caloriesRange}
                    onValueChange={(value) => updateFilter('caloriesRange', value)}
                    className="relative w-full"
                    thumbClassName="block h-7 w-7 rounded-full border-2 border-gray-900 bg-white shadow-md hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 cursor-grab active:cursor-grabbing"
                  />
                </div>
              </div>
            </div>

            {/* Language Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-500">Language</Label>
              <Select 
                value={filterState.language} 
                onValueChange={(value) => updateFilter('language', value)}
              >
                <SelectTrigger className="w-full h-12 rounded-xl bg-white border-gray-200">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(LANGUAGE_CODES).map((lang) => (
                    <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Image Generation Toggle */}
            <div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="generate-image"
                  checked={filterState.generateImage}
                  onCheckedChange={(checked) => updateFilter('generateImage', checked)}
                  disabled={isGenerating || isGeneratingImage}
                  className="data-[state=checked]:bg-gray-900"
                />
                <Label htmlFor="generate-image" className="text-sm font-medium text-gray-700">
                  Generate AI image for recipe
                </Label>
              </div>
            </div>

            {/* Keywords Input */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-500">Additional Keywords</Label>
              <Input
                type="text"
                className="w-full h-12 rounded-xl bg-white border-gray-200"
                placeholder="e.g., quick, summer, festive, low-sugar, spicy (separated by commas)"
                value={filterState.keywords}
                onChange={(e) => updateFilter('keywords', e.target.value)}
                disabled={isGenerating || isGeneratingImage || isSaving}
              />
              <p className="text-xs text-gray-500">
                Add any specific preferences or requests not covered by the options above
              </p>
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
                        {/* Dynamically generate category badges */}
                        {generatedRecipe.categories?.meal_type && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            {generatedRecipe.categories.meal_type}
                          </span>
                        )}
                        
                        {generatedRecipe.categories?.dietary_restrictions?.map((restriction, index) => (
                          <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            {restriction}
                          </span>
                        ))}
                        
                        {generatedRecipe.categories?.difficulty_level && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                            {generatedRecipe.categories.difficulty_level}
                          </span>
                        )}
                        
                        {generatedRecipe.categories?.cuisine_type && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                            {generatedRecipe.categories.cuisine_type}
                          </span>
                        )}
                        
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
                  <RecipeMetric icon={Clock} label="Prep Time" value={`${generatedRecipe.prep_time} min`} />
                  <RecipeMetric icon={Timer} label="Cook Time" value={`${generatedRecipe.cook_time} min`} />
                  <RecipeMetric icon={Flame} label="Calories" value={`${generatedRecipe.estimated_calories} kcal`} />
                  <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500">Portions</p>
                    <p className="text-lg font-semibold">{generatedRecipe.suggested_portions} {generatedRecipe.portion_description}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-6">
            <RecipeIngredients ingredients={generatedRecipe.ingredients} />
          </div>

          <div className="lg:col-span-6">
            <RecipeInstructions instructions={generatedRecipe.instructions} />
          </div>
        </div>
      )}

      {filterState.generateImage && generatedRecipe && !generatedRecipe.image_url && (
        <ImageGenerator
          prompt={`${generatedRecipe.title}: ${generatedRecipe.description}`}
          embedded={true}
          onImageGenerated={(imageUrl) => {
            setGeneratedRecipe(prev => prev ? { ...prev, image_url: imageUrl } : null);
            setIsGeneratingImage(false);
          }}
        />
      )}
    </RecipePageLayout>
  );
} 