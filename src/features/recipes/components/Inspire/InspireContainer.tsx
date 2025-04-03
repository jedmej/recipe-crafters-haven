import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserPreferences } from '@/hooks/use-user-preferences';
import { PageLayout } from '../RecipeContainer/PageLayout';
import { RecipeDisplay } from "@/components/recipes/RecipeDisplay";
import { RecipeData } from "@/types/recipe";
import { SearchSection } from './SearchSection';
import { SectionDivider } from './components/SectionDivider';
import { InspireForm } from './InspireForm';
import { scaleRecipe } from '@/utils/recipe-scaling';
import { useImageGeneration } from '@/features/recipes/hooks/useImageGeneration';
import { RecipeLoadingAnimation } from '../UI/RecipeLoadingAnimation';
import { useRecipeGeneration } from '../../hooks/useRecipeGeneration';

// Constants for language codes
const LANGUAGE_NAMES = {
  'en': 'English',
  'es': 'Spanish', 
  'fr': 'French',
  'it': 'Italian',
  'de': 'German',
  'pl': 'Polish',
  'ru': 'Russian',
  'uk': 'Ukrainian'
} as const;

type GenerationMode = 'search' | 'inspire';

interface FilterState {
  mealType: string[];
  healthFocus: string[];
  dietaryRestrictions: string[];
  difficultyLevel: string[];
  cuisineType: string[];
  cookingMethod: string[];
  occasion: string[];
  courseCategory: string[];
  tasteProfile: string[];
  customValues: Record<string, string>;
  dynamicCategories: Record<string, string[]>;
}

interface CategoryFilters {
  meal_type: string | null;
  health_focus: string | null | string[];
  dietary_restrictions: string | null | string[];
  difficulty_level: string | null;
  cuisine_type: string | null;
  cooking_method: string | null | string[];
  occasion: string | null;
  course_category: string | null;
  taste_profile: string | null | string[];
}

// Create a mutable version of filter categories that can be updated with new values
let FILTER_CATEGORIES = {
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

export function InspireContainer() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { preferences } = useUserPreferences();
  const location = useLocation();
  
  // Get query parameters from URL if they exist
  const queryParams = new URLSearchParams(location.search);
  const queryFromUrl = queryParams.get('query');
  const generateImageFromUrl = queryParams.get('generateImage') === 'true';
  
  // Search state
  const [searchQuery, setSearchQuery] = useState(queryFromUrl || '');
  
  // Recipe inspiration form state
  const [ingredients, setIngredients] = useState<string>("");
  const [cookingTime, setCookingTime] = useState<number>(30);
  const [filters, setFilters] = useState<FilterState>({
    mealType: [],
    healthFocus: [],
    dietaryRestrictions: [],
    difficultyLevel: [],
    cuisineType: [],
    cookingMethod: [],
    occasion: [],
    courseCategory: [],
    tasteProfile: [],
    customValues: {},
    dynamicCategories: {}
  });
  const [language, setLanguage] = useState<string>(preferences.language || 'en');
  const [useIngredients, setUseIngredients] = useState<boolean>(false);
  const [shouldGenerateImage, setShouldGenerateImage] = useState<boolean>(generateImageFromUrl);
  
  // Recipe detail view state
  const [desiredServings, setDesiredServings] = useState(4);
  const [measurementSystem, setMeasurementSystem] = useState<'metric' | 'imperial'>(
    preferences.unitSystem || 'metric'
  );

  const [generatedRecipe, setGeneratedRecipe] = useState<RecipeData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Recipe generation hook
  const {
    generateAndSaveRecipe,
    isGenerating: isGeneratingRecipe,
    isGeneratingImage,
    recipeImage
  } = useRecipeGeneration({
    onSuccess: () => {
      setGeneratedRecipe(null);
      setIsLoading(false);
    },
    onError: () => {
      setIsLoading(false);
    },
    shouldGenerateImage
  });
  
  // Combine the local loading state with the hook's loading state
  const isGenerating = isLoading || isGeneratingRecipe;

  // Update language when user preferences change
  useEffect(() => {
    setLanguage(preferences.language || 'en');
  }, [preferences.language]);
  
  // Auto-trigger search if query parameter is present
  useEffect(() => {
    if (queryFromUrl && !generatedRecipe && !isGenerating) {
      // Set a small timeout to ensure component is fully mounted
      const timer = setTimeout(() => {
        handleSearch(new Event('submit') as React.FormEvent);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [queryFromUrl, generatedRecipe, isGenerating]);

  // Function to update filter categories with new values
  const updateFilterCategories = (category: string, newValue: string) => {
    // Skip if the value is already in the options or is empty
    if (!newValue || 
        FILTER_CATEGORIES[category as keyof typeof FILTER_CATEGORIES].options.includes(newValue)) {
      return false;
    }
    
    // Add the new value to the options
    FILTER_CATEGORIES = {
      ...FILTER_CATEGORIES,
      [category]: {
        ...FILTER_CATEGORIES[category as keyof typeof FILTER_CATEGORIES],
        options: [
          ...FILTER_CATEGORIES[category as keyof typeof FILTER_CATEGORIES].options.filter(opt => opt !== "Other"),
          newValue,
          "Other" // Keep "Other" at the end
        ]
      }
    };
    
    // Also update the dynamic categories for suggestions
    setFilters(prev => ({
      ...prev,
      dynamicCategories: {
        ...prev.dynamicCategories,
        [category]: [...(prev.dynamicCategories[category] || []), newValue]
      }
    }));
    
    return true;
  };

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

  // Event handlers
  const handleGenerateRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Set isGenerating to true immediately to show the loading animation
    // We'll rely on the mutation to handle any state resets on completion
    setIsLoading(true);
    
    // Clear search query when using inspire section
    setSearchQuery("");
    
    // Transform filters into categories object
    const categoryFilters = {
      meal_type: filters.mealType?.[0] === "Other" 
        ? filters.customValues.mealType || null 
        : filters.mealType?.[0] || null,
      health_focus: filters.healthFocus?.[0] === "Other"
        ? filters.customValues.healthFocus || null
        : filters.healthFocus?.[0] || null,
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

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("User not authenticated");

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

      // Process the generated recipe
      const recipeData = data?.data || data;
      await generateAndSaveRecipe(recipeData);
    } catch (error) {
      // Reset loading state on error
      setIsLoading(false);
      
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: "We couldn't generate a recipe with these criteria. Please try different options.",
      });
    }
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
    
    // Set isGenerating to true immediately to show the loading animation
    setIsLoading(true);
    
    // Clear any inspire section inputs
    setIngredients("");
    setCookingTime(30);
    setFilters({
      mealType: [],
      healthFocus: [],
      dietaryRestrictions: [],
      difficultyLevel: [],
      cuisineType: [],
      cookingMethod: [],
      occasion: [],
      courseCategory: [],
      tasteProfile: [],
      customValues: {},
      dynamicCategories: {}
    });
    setUseIngredients(false);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("User not authenticated");

      console.log('Sending search request with query:', searchQuery);

      const response = await supabase.functions.invoke('recipe-chat', {
        body: { 
          query: searchQuery, 
          language,
          generateAllCategories: true 
        }
      });

      console.log('Raw Edge Function response:', response);

      if (response.error) {
        console.error('Edge Function error:', response.error);
        throw response.error;
      }

      // Handle different response formats
      let recipeData;
      if (response.data?.success && response.data?.data) {
        // Standard format: { success: true, data: { ... } }
        recipeData = response.data.data;
      } else if (response.data?.recipe) {
        // Alternative format: { recipe: { ... } }
        recipeData = response.data.recipe;
      } else if (typeof response.data === 'object' && response.data !== null) {
        // Direct format: { title: ..., description: ..., etc }
        recipeData = response.data;
      } else {
        console.error('Unexpected response format:', response);
        throw new Error('Unexpected response format from recipe generation');
      }

      console.log('Extracted recipe data:', recipeData);

      // Validate required fields
      if (!recipeData) {
        throw new Error('No recipe data returned');
      }

      if (!recipeData.title) {
        console.error('Recipe data missing title:', recipeData);
        throw new Error('Recipe title is required but was not provided');
      }

      // Ensure the recipe data is properly formatted before saving
      const formattedRecipe = {
        title: recipeData.title.trim(),
        description: recipeData.description?.trim() || null,
        ingredients: Array.isArray(recipeData.ingredients) 
          ? recipeData.ingredients.filter(Boolean).map(i => i.trim()) 
          : [],
        instructions: Array.isArray(recipeData.instructions) 
          ? recipeData.instructions.filter(Boolean).map(i => i.trim()) 
          : [],
        cook_time: typeof recipeData.cook_time === 'number' ? recipeData.cook_time : null,
        prep_time: typeof recipeData.prep_time === 'number' ? recipeData.prep_time : null,
        estimated_calories: typeof recipeData.estimated_calories === 'number' ? recipeData.estimated_calories : null,
        suggested_portions: typeof recipeData.suggested_portions === 'number' ? recipeData.suggested_portions : 4,
        portion_size: typeof recipeData.portion_size === 'number' ? recipeData.portion_size : 4,
        portion_description: recipeData.portion_description?.trim() || 'serving',
        source_url: recipeData.source_url || null,
        image_url: recipeData.image_url || null,
        language: recipeData.language || language || 'en',
        categories: {
          meal_type: recipeData.categories?.meal_type || null,
          dietary_restrictions: Array.isArray(recipeData.categories?.dietary_restrictions) 
            ? recipeData.categories.dietary_restrictions[0] 
            : recipeData.categories?.dietary_restrictions || null,
          difficulty_level: recipeData.categories?.difficulty_level || null,
          cuisine_type: recipeData.categories?.cuisine_type || null,
          cooking_method: Array.isArray(recipeData.categories?.cooking_method)
            ? recipeData.categories.cooking_method[0]
            : recipeData.categories?.cooking_method || null
        }
      };

      console.log('Formatted recipe:', formattedRecipe);

      await generateAndSaveRecipe(formattedRecipe);
    } catch (error) {
      // Reset loading state on error
      setIsLoading(false);
      
      console.error('Search error:', error);
      toast({
        variant: "destructive",
        title: "Search Failed",
        description: error instanceof Error ? error.message : "We couldn't generate a recipe from your search. Please try a different query.",
      });
    }
  };

  const handleImageSelected = (imageUrl: string) => {
    setRecipeImage(imageUrl);
  };

  const toggleMeasurementSystem = () => {
    setMeasurementSystem(prev => prev === 'metric' ? 'imperial' : 'metric');
  };

  return (
    <PageLayout>
      <RecipeLoadingAnimation isVisible={isGenerating} />
      
      {/* Search and Inspire sections */}
      {!generatedRecipe && (
        <>
          <SearchSection 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isGenerating={isGenerating}
            handleSearch={handleSearch}
            shouldGenerateImage={shouldGenerateImage}
            setShouldGenerateImage={setShouldGenerateImage}
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
            isGenerating={isGenerating}
            handleGenerateRecipe={handleGenerateRecipe}
            shouldGenerateImage={shouldGenerateImage}
            setShouldGenerateImage={setShouldGenerateImage}
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
          onSave={() => generateAndSaveRecipe(generatedRecipe)}
          isSaving={isGenerating}
          onImageUpdate={handleImageSelected}
          onEditOrGenerate={() => {
            setGeneratedRecipe(null);
          }}
          onBack={() => {
            setGeneratedRecipe(null);
          }}
          isGeneratingImage={isGeneratingImage}
        />
      )}
    </PageLayout>
  );
}