import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
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
  
  // Recipe generation state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedRecipe, setGeneratedRecipe] = useState<RecipeData | null>(null);
  const [recipeImage, setRecipeImage] = useState<string | null>(null);
  const [shouldGenerateImage, setShouldGenerateImage] = useState<boolean>(generateImageFromUrl);
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  
  // Recipe detail view state
  const [desiredServings, setDesiredServings] = useState(4);
  const [measurementSystem, setMeasurementSystem] = useState<'metric' | 'imperial'>(
    preferences.measurementSystem || 'metric'
  );

  // Image generation hook
  const { generateImage } = useImageGeneration();

  // Update language when user preferences change
  useEffect(() => {
    setLanguage(preferences.language || 'en');
  }, [preferences.language]);
  
  // Auto-trigger search if query parameter is present
  useEffect(() => {
    if (queryFromUrl && !generatedRecipe && !isGenerating) {
      // Set a small timeout to ensure component is fully mounted
      const timer = setTimeout(() => {
        setIsGenerating(true);
        setGeneratedRecipe(null);
        setRecipeImage(null);
        generateRecipe.mutate({ query: queryFromUrl, mode: 'search' });
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
      
      // Process each category value and update filter options if needed
      const categoryMapping: Record<string, string> = {
        'meal_type': 'mealType',
        'dietary_restrictions': 'dietaryRestrictions',
        'difficulty_level': 'difficultyLevel',
        'cuisine_type': 'cuisineType',
        'cooking_method': 'cookingMethod',
        'occasion': 'occasion',
        'course_category': 'courseCategory',
        'taste_profile': 'tasteProfile'
      };
      
      // Process each category and check for new values
      Object.entries(recipeData.categories).forEach(([field, value]) => {
        const frontendCategory = categoryMapping[field];
        if (!frontendCategory) return;
        
        // Handle both single values and arrays
        if (Array.isArray(value)) {
          value.forEach(val => {
            if (val && typeof val === 'string') {
              updateFilterCategories(frontendCategory, val);
            }
          });
        } else if (value && typeof value === 'string') {
          updateFilterCategories(frontendCategory, value);
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
      
      // Handle multiple values for categories that support arrays
      if (Array.isArray(recipeData.categories?.dietary_restrictions)) {
        formattedCategories.dietary_restrictions = recipeData.categories.dietary_restrictions;
      }
      
      if (Array.isArray(recipeData.categories?.cooking_method)) {
        formattedCategories.cooking_method = recipeData.categories.cooking_method;
      }
      
      if (Array.isArray(recipeData.categories?.taste_profile)) {
        formattedCategories.taste_profile = recipeData.categories.taste_profile;
      }

      // Log the recipe structure before saving
      console.log('Saving recipe with structure:', JSON.stringify(generatedRecipe, null, 2));
      
      const scaledRecipe = scaleRecipe(
        generatedRecipe,
        desiredServings,
        generatedRecipe.suggested_portions
      );
      
      // Prepare recipe data for saving
      const recipeToSave = {
        title: scaledRecipe.title,
        description: scaledRecipe.description,
        ingredients: scaledRecipe.ingredients,
        instructions: scaledRecipe.instructions,
        cook_time: scaledRecipe.cook_time,
        prep_time: scaledRecipe.prep_time,
        estimated_calories: scaledRecipe.estimated_calories,
        suggested_portions: scaledRecipe.suggested_portions,
        portion_size: desiredServings,
        source_url: scaledRecipe.source_url,
        image_url: recipeImage,
        categories: formattedCategories,
        user_id: session.user.id
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
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: error.message || "Failed to save the recipe. Please try again.",
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

  // Automatically generate image when recipe is generated and shouldGenerateImage is true
  useEffect(() => {
    const generateImageForRecipe = async () => {
      if (generatedRecipe && shouldGenerateImage && !recipeImage) {
        // Generate image prompt based on recipe title
        const imagePrompt = `professional food photography: ${generatedRecipe.title.trim()}, appetizing presentation, elegant plating, soft natural lighting, shallow depth of field, bokeh effect, clean background, no text overlay, minimalist style, high resolution, food magazine quality, centered composition, vibrant colors, crisp details, no text, no words, no writing, no labels, no watermarks`;
        
        try {
          setIsGeneratingImage(true);
          const generatedImageUrl = await generateImage(imagePrompt, 'recipe');
          
          if (generatedImageUrl) {
            setRecipeImage(generatedImageUrl);
          }
        } catch (error) {
          console.error('Error generating image:', error);
          toast({
            title: "Image Generation Failed",
            description: "We couldn't generate an image for this recipe. You can try again manually.",
            variant: "destructive",
          });
        } finally {
          setIsGeneratingImage(false);
        }
      }
    };

    generateImageForRecipe();
  }, [generatedRecipe, shouldGenerateImage, recipeImage, generateImage, toast]);

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
          onBack={() => {
            setGeneratedRecipe(null);
            setRecipeImage(null);
          }}
          isGeneratingImage={isGeneratingImage}
        />
      )}
    </PageLayout>
  );
}