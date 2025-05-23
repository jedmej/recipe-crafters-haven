
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, MessageSquareText, Bot } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { RECIPE_CATEGORIES } from '@/types/recipe';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { InspireForm } from './InspireForm';
import { RecipeDisplay } from '@/components/recipes/RecipeDisplay';
import { PageLayout } from '../RecipeContainer/PageLayout';
import { RecipeData } from '@/types/recipe';

// Helper function to ensure we're working with arrays
const ensureArray = (value: string | string[] | undefined): string[] => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

export function InspireContainer() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { preferences } = useUserPreferences();
  
  // Form state
  const [query, setQuery] = useState('');
  const [excludeIngredients, setExcludeIngredients] = useState('');
  const [maxPrepTime, setMaxPrepTime] = useState(60);
  const [maxCalories, setMaxCalories] = useState(800);
  const [includeGeneratedImage, setIncludeGeneratedImage] = useState(true);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({
    meal_type: [],
    dietary_restrictions: [],
    difficulty_level: [],
    cuisine_type: [],
    cooking_method: [],
    occasion: [],
    course_category: [],
    taste_profile: [],
  });
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [isExpanded, setIsExpanded] = useState(false);

  // Recipe state
  const [suggestedRecipe, setSuggestedRecipe] = useState<RecipeData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [chosenPortions, setChosenPortions] = useState(2);
  const [measurementSystem, setMeasurementSystem] = useState<'metric' | 'imperial'>(
    preferences.measurementSystem || 'metric'
  );
  const [recipeImage, setRecipeImage] = useState<string | null>(null);
  
  // Dynamic categories for form filters
  const [dynamicCategories, setDynamicCategories] = useState<Record<string, string[]>>({
    meal_type: [],
    dietary_restrictions: [],
    difficulty_level: [],
    cuisine_type: [],
    cooking_method: [],
    occasion: [],
    course_category: [],
    taste_profile: [],
  });
  
  // Load dynamic categories from the database
  useEffect(() => {
    const loadCategories = async () => {
      try {
        // Extract unique values for each category from the database
        const { data: recipes, error } = await supabase
          .from('recipes')
          .select('categories')
          .not('categories', 'is', null);
        
        if (error) {
          console.error('Error loading categories:', error);
          return;
        }
        
        const categories: Record<string, Set<string>> = {
          meal_type: new Set<string>(),
          dietary_restrictions: new Set<string>(),
          difficulty_level: new Set<string>(),
          cuisine_type: new Set<string>(),
          cooking_method: new Set<string>(),
          occasion: new Set<string>(),
          course_category: new Set<string>(),
          taste_profile: new Set<string>(),
        };
        
        recipes.forEach(recipe => {
          if (!recipe.categories) return;
          
          // Extract and add categories
          Object.entries(recipe.categories).forEach(([key, value]) => {
            if (!value) return;
            
            if (typeof value === 'string') {
              categories[key]?.add(value);
            } else if (Array.isArray(value)) {
              value.forEach(val => {
                if (typeof val === 'string') {
                  categories[key]?.add(val);
                }
              });
            }
          });
        });
        
        // Convert Sets to Arrays and set the state
        const dynamicCats: Record<string, string[]> = {};
        Object.entries(categories).forEach(([key, valueSet]) => {
          dynamicCats[key] = Array.from(valueSet).sort();
        });
        
        // Merge with default categories from RECIPE_CATEGORIES
        Object.entries(RECIPE_CATEGORIES).forEach(([key, defaultValues]) => {
          const existingValues = dynamicCats[key] || [];
          const combinedValues = [...new Set([...existingValues, ...defaultValues])].sort();
          dynamicCats[key] = combinedValues;
        });
        
        setDynamicCategories(dynamicCats);
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };
    
    loadCategories();
  }, []);
  
  // API Mutations
  
  // Generate recipe mutation
  const generateRecipe = useMutation({
    mutationFn: async () => {
      // Format filters
      const formattedFilters: Record<string, string | string[]> = {};
      
      Object.entries(selectedFilters).forEach(([category, values]) => {
        if (values.length === 0 && customValues[category]) {
          formattedFilters[category] = customValues[category];
        } else if (values.length > 0) {
          formattedFilters[category] = values.length === 1 ? values[0] : values;
        }
      });
      
      // Call the API to generate a recipe
      const { data, error } = await supabase.functions.invoke('ai-recipe-generate', {
        body: {
          query,
          excludeIngredients: excludeIngredients ? excludeIngredients.split(',').map(i => i.trim()) : [],
          maxPrepTime,
          maxCalories,
          categories: formattedFilters,
          language: preferences.language,
        }
      });
      
      if (error) {
        throw new Error(`Failed to generate recipe: ${error.message}`);
      }
      
      return data;
    },
    onSuccess: (data) => {
      const recipe: RecipeData = {
        id: uuidv4(), // Generate a temporary ID
        title: data.title,
        description: data.description,
        ingredients: data.ingredients,
        instructions: data.instructions,
        prep_time: data.prep_time,
        cook_time: data.cook_time,
        estimated_calories: data.estimated_calories,
        suggested_portions: data.suggested_portions || 2,
        portion_description: 'servings',
        categories: data.categories,
        language: preferences.language,
      };
      
      setSuggestedRecipe(recipe);
      setChosenPortions(recipe.suggested_portions || 2);
      
      // Generate image if requested
      if (includeGeneratedImage) {
        generateImage(recipe.title, recipe.description);
      }
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to generate recipe",
        description: error.message,
      });
    },
  });
  
  // Save recipe mutation
  const saveRecipe = useMutation({
    mutationFn: async () => {
      if (!suggestedRecipe) throw new Error('No recipe to save');
      
      // Format the recipe data for storage
      const saveData = {
        title: suggestedRecipe.title,
        description: suggestedRecipe.description,
        ingredients: suggestedRecipe.ingredients,
        instructions: suggestedRecipe.instructions,
        prep_time: suggestedRecipe.prep_time || 0,
        cook_time: suggestedRecipe.cook_time || 0,
        estimated_calories: suggestedRecipe.estimated_calories || 0,
        servings: chosenPortions,
        suggested_portions: suggestedRecipe.suggested_portions || chosenPortions,
        portion_description: 'servings',
        image_url: recipeImage || undefined,
        categories: suggestedRecipe.categories,
        language: preferences.language,
      };
      
      const { data, error } = await supabase
        .from('recipes')
        .insert(saveData)
        .select('id')
        .single();
      
      if (error) {
        throw error;
      }
      
      return data.id;
    },
    onSuccess: (recipeId) => {
      toast({
        title: "Recipe Saved",
        description: "Your recipe has been saved successfully.",
      });
      
      // Navigate to the recipe detail page
      navigate(`/recipes/${recipeId}`);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to save recipe",
        description: error.message,
      });
    },
  });
  
  // Generate image function
  const generateImage = async (title: string, description: string) => {
    setIsGeneratingImage(true);
    
    try {
      // Generate a prompt for the image
      const prompt = `A professional, appetizing food photo of: ${title}. ${description}. High resolution, top-down view, vibrant colors, soft natural lighting.`;
      
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: { prompt }
      });
      
      if (error) throw error;
      
      setRecipeImage(data.imageUrl);
      
      // Update the suggested recipe with the image URL
      if (suggestedRecipe) {
        setSuggestedRecipe({
          ...suggestedRecipe,
          imageUrl: data.imageUrl
        });
      }
    } catch (error) {
      console.error('Failed to generate image:', error);
      toast({
        variant: "destructive",
        title: "Failed to generate image",
        description: "Could not generate a recipe image. You can try again later.",
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };
  
  // Form handlers
  const toggleFilter = (category: string, option: string) => {
    setSelectedFilters(prev => {
      const current = prev[category] || [];
      const updated = current.includes(option)
        ? current.filter(item => item !== option)
        : [...current, option];
      
      return {
        ...prev,
        [category]: updated
      };
    });
  };
  
  const setCustomValue = (category: string, value: string) => {
    setCustomValues(prev => ({
      ...prev,
      [category]: value
    }));
  };
  
  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      toast({
        variant: "destructive",
        title: "Query Required",
        description: "Please describe what kind of recipe you want.",
      });
      return;
    }
    
    setIsGenerating(true);
    setSuggestedRecipe(null);
    setRecipeImage(null);
    
    generateRecipe.mutate(undefined, {
      onSettled: () => {
        setIsGenerating(false);
      }
    });
  };
  
  // Handler for updating recipe image
  const handleImageUpdate = async (imageUrl: string): Promise<void> => {
    if (!suggestedRecipe) return;
    
    setRecipeImage(imageUrl);
    setSuggestedRecipe({
      ...suggestedRecipe,
      imageUrl
    });
    
    return Promise.resolve();
  };

  return (
    <PageLayout>
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="outline"
          onClick={() => navigate("/recipes")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Recipes
        </Button>
      </div>
      
      <Card className="overflow-hidden rounded-[48px] mb-8">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bot className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-gray-900">AI Recipe Generator</h1>
          </div>
          
          <InspireForm 
            query={query}
            setQuery={setQuery}
            excludeIngredients={excludeIngredients}
            setExcludeIngredients={setExcludeIngredients}
            maxPrepTime={maxPrepTime}
            setMaxPrepTime={setMaxPrepTime}
            maxCalories={maxCalories}
            setMaxCalories={setMaxCalories}
            includeGeneratedImage={includeGeneratedImage}
            setIncludeGeneratedImage={setIncludeGeneratedImage}
            selectedFilters={selectedFilters}
            toggleFilter={toggleFilter}
            customValues={customValues}
            setCustomValue={setCustomValue}
            isGenerating={isGenerating}
            isExpanded={isExpanded}
            handleSubmit={handleSubmit}
            handleToggleExpand={handleToggleExpand}
            dynamicCategories={dynamicCategories}
          />
        </CardContent>
      </Card>
      
      {isGenerating && (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-lg text-gray-700">Generating your recipe...</p>
        </div>
      )}
      
      {suggestedRecipe && !isGenerating && (
        <RecipeDisplay
          recipe={suggestedRecipe}
          scaledRecipe={suggestedRecipe}
          chosenPortions={chosenPortions}
          onPortionsChange={setChosenPortions}
          onSave={() => {
            setIsSaving(true);
            saveRecipe.mutate(undefined, {
              onSettled: () => setIsSaving(false)
            });
          }}
          isSaving={isSaving}
          measurementSystem={measurementSystem}
          onMeasurementSystemChange={() => setMeasurementSystem(prev => 
            prev === 'metric' ? 'imperial' : 'metric'
          )}
          onImageUpdate={handleImageUpdate}
          isGeneratingImage={isGeneratingImage}
          onEditOrGenerate={() => console.log("Edit or generate clicked")}
          onBack={() => navigate("/recipes")}
        />
      )}
    </PageLayout>
  );
}
