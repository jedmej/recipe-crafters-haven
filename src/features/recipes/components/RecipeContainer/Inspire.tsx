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
import { Separator } from "@/components/ui/separator";
import { RecipeData } from "@/types/recipe";

// Types and constants
type MeasurementSystem = 'metric' | 'imperial';
type GenerationMode = 'search' | 'inspire';

interface CategoryFilters {
  meal_type: string | null;
  dietary_restrictions: string | null;
  difficulty_level: string | null;
  cuisine_type: string | null;
  cooking_method: string | null;
  occasion: string | null;
  course_category: string | null;
  taste_profile: string | null;
}

interface FilterState {
  mealType: string[];
  dietaryRestrictions: string[];
  difficultyLevel: string[];
  cuisineType: string[];
  cookingMethod: string[];
  occasion: string[];
  courseCategory: string[];
  tasteProfile: string[];
  customValues: Record<string, string>;
}

// Constants for language codes and categories
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
    options: [
      "Breakfast",
      "Brunch",
      "Lunch",
      "Dinner",
      "Snacks",
      "Dessert",
      "Appetizer",
      "Soup",
      "Side Dish",
      "Other"
    ],
    badgeClass: "bg-blue-100 text-blue-800"
  },
  dietaryRestrictions: {
    title: "Dietary Restrictions",
    options: [
      "Vegetarian",
      "Vegan",
      "Gluten-free",
      "Dairy-free",
      "Keto",
      "Paleo",
      "Halal",
      "Kosher",
      "Nut-free",
      "Low-Sodium",
      "Other"
    ],
    badgeClass: "bg-green-100 text-green-800"
  },
  difficultyLevel: {
    title: "Difficulty Level",
    options: [
      "Easy",
      "Medium",
      "Hard",
      "Expert"
    ],
    badgeClass: "bg-yellow-100 text-yellow-800"
  },
  cuisineType: {
    title: "Cuisine Type",
    options: [
      "Italian",
      "Mexican",
      "Chinese",
      "Japanese",
      "Thai",
      "French",
      "Middle Eastern",
      "Indian",
      "American",
      "Mediterranean",
      "Caribbean",
      "Greek",
      "Spanish",
      "Other"
    ],
    badgeClass: "bg-purple-100 text-purple-800"
  },
  cookingMethod: {
    title: "Cooking Method",
    options: [
      "Baking",
      "Frying",
      "Grilling",
      "Roasting",
      "Steaming",
      "Boiling",
      "Slow Cooking",
      "Sous Vide",
      "Other"
    ],
    badgeClass: "bg-red-100 text-red-800"
  },
  occasion: {
    title: "Occasion",
    options: [
      "Everyday",
      "Party",
      "Holiday",
      "Birthday",
      "Other"
    ],
    badgeClass: "bg-pink-100 text-pink-800"
  },
  courseCategory: {
    title: "Course Category",
    options: [
      "Soup",
      "Salad",
      "Main Course",
      "Side Dish",
      "Dessert",
      "Beverage",
      "Other"
    ],
    badgeClass: "bg-indigo-100 text-indigo-800"
  },
  // Taste/Flavor Profile
  tasteProfile: {
    title: "Taste/Flavor Profile",
    options: [
      "Sweet",
      "Savory",
      "Spicy",
      "Sour",
      "Salty",
      "Bitter",
      "Umami",
      "Tangy",
      "Mild",
      "Other"
    ],
    badgeClass: "bg-orange-100 text-orange-800"
  }
};

// Component for the search section
const SearchSection = ({ 
  searchQuery, 
  setSearchQuery, 
  language, 
  setLanguage, 
  isGenerating, 
  handleSearch 
}: {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  language: string;
  setLanguage: (lang: string) => void;
  isGenerating: boolean;
  handleSearch: (e: React.FormEvent) => void;
}) => (
  <Card className="mb-8">
    <CardContent className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Find Your Perfect Recipe</h1>
      
      <form onSubmit={handleSearch} className="space-y-4">
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
  </Card>
);

// Component for the divider between search and inspire sections
const SectionDivider = () => (
  <div className="relative my-8">
    <div className="absolute inset-0 flex items-center">
      <span className="w-full border-t" />
    </div>
    <div className="relative flex justify-center text-xs uppercase">
      <span className="bg-gray-50 px-2 text-muted-foreground">or let us inspire you</span>
    </div>
  </div>
);

// Component for the filter buttons
const FilterButtons = ({ 
  category, 
  title, 
  options, 
  selectedFilters, 
  toggleFilter, 
  isGenerating,
  customValues,
  setCustomValue
}: {
  category: string;
  title: string;
  options: string[];
  selectedFilters: string[];
  toggleFilter: (category: string, option: string) => void;
  isGenerating: boolean;
  customValues: Record<string, string>;
  setCustomValue: (category: string, value: string) => void;
}) => {
  const isOtherSelected = selectedFilters.includes("Other");
  
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{title}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => toggleFilter(category, option)}
            className={`px-3 py-1 rounded-full text-sm ${
              selectedFilters.includes(option)
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
            disabled={isGenerating}
          >
            {option}
          </button>
        ))}
      </div>
      
      {isOtherSelected && (
        <div className="mt-2">
          <Input
            placeholder={`Enter custom ${title.toLowerCase()}`}
            value={customValues[category] || ''}
            onChange={(e) => setCustomValue(category, e.target.value)}
            disabled={isGenerating}
            className="text-sm"
          />
        </div>
      )}
    </div>
  );
};

// Component for the inspire form
const InspireForm = ({ 
  useIngredients,
  setUseIngredients,
  ingredients,
  setIngredients,
  cookingTime,
  setCookingTime,
  filters,
  toggleFilter,
  setCustomValue,
  language,
  setLanguage,
  isGenerating,
  handleGenerateRecipe
}: {
  useIngredients: boolean;
  setUseIngredients: (use: boolean) => void;
  ingredients: string;
  setIngredients: (ingredients: string) => void;
  cookingTime: number;
  setCookingTime: (time: number) => void;
  filters: FilterState;
  toggleFilter: (category: string, option: string) => void;
  setCustomValue: (category: string, value: string) => void;
  language: string;
  setLanguage: (lang: string) => void;
  isGenerating: boolean;
  handleGenerateRecipe: (e: React.FormEvent) => void;
}) => (
  <Card className="mb-8">
    <CardContent className="p-6">
      <h1 className="text-3xl font-bold mb-6">Get Inspired with AI</h1>
      
      <form onSubmit={handleGenerateRecipe} className="space-y-8">
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
              <FilterButtons
                key={category}
                category={category}
                title={title}
                options={options}
                selectedFilters={filters[category as keyof FilterState]}
                toggleFilter={toggleFilter}
                isGenerating={isGenerating}
                customValues={filters.customValues}
                setCustomValue={setCustomValue}
              />
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
);

// Main component
export function InspireContainer() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { preferences } = useUserPreferences();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Recipe inspiration form state
  const [ingredients, setIngredients] = useState<string>("");
  const [cookingTime, setCookingTime] = useState<number>(30);
  const [filters, setFilters] = useState<FilterState>({
    mealType: [],
    dietaryRestrictions: [],
    difficultyLevel: [],
    cuisineType: [],
    cookingMethod: [],
    occasion: [],
    courseCategory: [],
    tasteProfile: [],
    customValues: {}
  });
  const [language, setLanguage] = useState<string>(preferences.language || 'en');
  const [useIngredients, setUseIngredients] = useState<boolean>(false);
  
  // Recipe generation state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedRecipe, setGeneratedRecipe] = useState<RecipeData | null>(null);
  const [recipeImage, setRecipeImage] = useState<string | null>(null);
  
  // Recipe detail view state
  const [desiredServings, setDesiredServings] = useState(4);
  const [measurementSystem, setMeasurementSystem] = useState<MeasurementSystem>(
    preferences.measurementSystem || 'metric'
  );
  
  // Unused state (keeping for compatibility)
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
      const currentCategoryFilters = prev[category as keyof FilterState] || [];
      
      // If this is the "Other" option
      if (option === "Other") {
        // If Other is already selected, deselect it
        if (currentCategoryFilters.includes("Other")) {
          const updatedFilters = currentCategoryFilters.filter(item => item !== "Other");
          const updatedCustomValues = { ...prev.customValues };
          delete updatedCustomValues[category];
          
          return {
            ...prev,
            [category]: updatedFilters,
            customValues: updatedCustomValues
          } as FilterState;
        } 
        // Otherwise select it, replacing any other selection in this category
        else {
          return {
            ...prev,
            [category]: ["Other"]
          } as FilterState;
        }
      }
      // If this is a custom value for an "Other" option
      else if (currentCategoryFilters.includes("Other") && option !== "Other") {
        return {
          ...prev,
          customValues: {
            ...prev.customValues,
            [category]: option
          }
        } as FilterState;
      }
      // Regular option toggle behavior
      else {
        const updatedCategoryFilters = currentCategoryFilters.includes(option)
          ? currentCategoryFilters.filter(item => item !== option)
          : [option]; // Replace existing selection with new one
        
        return {
          ...prev,
          [category]: updatedCategoryFilters
        } as FilterState;
      }
    });
  };

  // Function to set a custom value for a category
  const setCustomValue = (category: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      customValues: {
        ...prev.customValues,
        [category]: value
      }
    }));
  };

  // Compound active filters for API call
  const activeFilters = useMemo(() => {
    const standardFilters = Object.entries(filters)
      .filter(([key]) => key !== 'customValues')
      .flatMap(([category, options]) => options)
      .filter(option => option !== 'Other');
    
    // Add custom values if they exist
    const customFilters = Object.entries(filters.customValues)
      .map(([_, value]) => value)
      .filter(Boolean);
    
    return [...standardFilters, ...customFilters];
  }, [filters]);

  // Recipe generation mutation
  const generateRecipe = useMutation({
    mutationFn: async ({ query, mode }: { query?: string; mode: GenerationMode } = { mode: 'inspire' }) => {
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
      const categoryFilters: CategoryFilters = {
        meal_type: filters.mealType?.[0] === "Other" 
          ? filters.customValues.mealType || null 
          : filters.mealType?.[0] || null,
        dietary_restrictions: filters.dietaryRestrictions?.[0] === "Other" 
          ? filters.customValues.dietaryRestrictions || null 
          : filters.dietaryRestrictions?.[0] || null,
        difficulty_level: filters.difficultyLevel?.[0] || null,
        cuisine_type: filters.cuisineType?.[0] === "Other" 
          ? filters.customValues.cuisineType || null 
          : filters.cuisineType?.[0] || null,
        cooking_method: filters.cookingMethod?.[0] === "Other" 
          ? filters.customValues.cookingMethod || null 
          : filters.cookingMethod?.[0] || null,
        occasion: filters.occasion?.[0] === "Other" 
          ? filters.customValues.occasion || null 
          : filters.occasion?.[0] || null,
        course_category: filters.courseCategory?.[0] === "Other" 
          ? filters.customValues.courseCategory || null 
          : filters.courseCategory?.[0] || null,
        taste_profile: filters.tasteProfile?.[0] === "Other" 
          ? filters.customValues.tasteProfile || null 
          : filters.tasteProfile?.[0] || null
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
      const categoryFields = ['meal_type', 'dietary_restrictions', 'difficulty_level', 'cuisine_type', 'cooking_method', 'occasion', 'course_category', 'taste_profile'];
      
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
      if (!recipeData.categories.occasion) recipeData.categories.occasion = filters.occasion?.[0] || "Everyday";
      if (!recipeData.categories.course_category) recipeData.categories.course_category = filters.courseCategory?.[0] || "Main Course";
      if (!recipeData.categories.taste_profile) recipeData.categories.taste_profile = filters.tasteProfile?.[0] || "Balanced";
      
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
        meal_type: recipeData.categories?.meal_type || 
          (filters.mealType?.[0] === "Other" ? filters.customValues.mealType : filters.mealType?.[0]) || 
          "Main Dish",
        dietary_restrictions: recipeData.categories?.dietary_restrictions || 
          (filters.dietaryRestrictions?.[0] === "Other" ? filters.customValues.dietaryRestrictions : filters.dietaryRestrictions?.[0]) || 
          "Regular",
        difficulty_level: recipeData.categories?.difficulty_level || 
          filters.difficultyLevel?.[0] || 
          "Medium",
        cuisine_type: recipeData.categories?.cuisine_type || 
          (filters.cuisineType?.[0] === "Other" ? filters.customValues.cuisineType : filters.cuisineType?.[0]) || 
          "International",
        cooking_method: recipeData.categories?.cooking_method || "Various",
        occasion: recipeData.categories?.occasion || "Everyday",
        course_category: recipeData.categories?.course_category || "Main Course",
        taste_profile: recipeData.categories?.taste_profile || 
          (filters.tasteProfile?.[0] === "Other" ? filters.customValues.tasteProfile : filters.tasteProfile?.[0]) || 
          "Balanced"
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

  // Event handlers
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
      cuisineType: [],
      cookingMethod: [],
      occasion: [],
      courseCategory: [],
      tasteProfile: [],
      customValues: {}
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

  const toggleMeasurementSystem = () => {
    setMeasurementSystem(prev => prev === 'metric' ? 'imperial' : 'metric');
  };

  // Utility functions
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
      
      {/* Search and Inspire sections */}
      {!generatedRecipe && (
        <>
          <SearchSection 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            language={language}
            setLanguage={setLanguage}
            isGenerating={isGenerating}
            handleSearch={handleSearch}
          />
          
          <SectionDivider />
          
          <InspireForm
            useIngredients={useIngredients}
            setUseIngredients={setUseIngredients}
            ingredients={ingredients}
            setIngredients={setIngredients}
            cookingTime={cookingTime}
            setCookingTime={setCookingTime}
            filters={filters}
            toggleFilter={toggleFilter}
            setCustomValue={setCustomValue}
            language={language}
            setLanguage={setLanguage}
            isGenerating={isGenerating}
            handleGenerateRecipe={handleGenerateRecipe}
          />
        </>
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