
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/hooks/use-toast';
import { useRecipeForm } from '../../hooks/useRecipeForm';
import { PageLayout } from './PageLayout';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RecipeFormData } from '../../types';
import { DEFAULT_RECIPE_FORM_DATA } from '../../utils/constants';
import { SUPPORTED_LANGUAGES } from '@/types/recipe';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export function ImportRecipeContainer() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [importType, setImportType] = useState('url');
  const [recipeUrl, setRecipeUrl] = useState('');
  const [recipeText, setRecipeText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { preferences } = useUserPreferences();

  const [preparedRecipe, setPreparedRecipe] = useState<RecipeFormData | null>(null);
  const [language, setLanguage] = useState<string>(preferences.language || 'en');

  const {
    formData,
    updateFormField,
    handleSubmit,
    isSubmitting
  } = useRecipeForm({
    initialData: preparedRecipe || DEFAULT_RECIPE_FORM_DATA,
    mode: 'import',
    onSuccess: (data) => {
      navigate(`/recipes/${data.id}`);
    }
  });

  // Import mutation for URL
  const importFromUrl = useMutation({
    mutationFn: async () => {
      if (!recipeUrl.trim()) {
        throw new Error('Please enter a valid URL');
      }

      const { data, error } = await supabase.functions.invoke('ai-recipe-import', {
        body: {
          type: 'url',
          content: recipeUrl,
          language
        }
      });

      if (error) throw error;
      if (!data) throw new Error('No data returned from import function');

      return data;
    },
    onSuccess: (data) => {
      // Format categories for our form
      const dietaryRestrictions = data.categories?.dietary_restrictions;
      const cookingMethod = data.categories?.cooking_method;

      const formattedRecipe: RecipeFormData = {
        title: data.title || '',
        description: data.description || '',
        ingredients: Array.isArray(data.ingredients) ? data.ingredients : [],
        instructions: Array.isArray(data.instructions) ? data.instructions : [],
        prep_time: data.prep_time || 0,
        cook_time: data.cook_time || 0,
        estimated_calories: data.estimated_calories || 0,
        servings: data.suggested_portions || 2,
        language,
        categories: {
          meal_type: data.categories?.meal_type || 'dinner',
          dietary_restrictions: Array.isArray(dietaryRestrictions) 
            ? dietaryRestrictions 
            : dietaryRestrictions ? [String(dietaryRestrictions)] : ['none'],
          difficulty_level: data.categories?.difficulty_level || 'medium',
          cuisine_type: data.categories?.cuisine_type || 'Other',
          cooking_method: Array.isArray(cookingMethod)
            ? cookingMethod
            : cookingMethod ? [String(cookingMethod)] : ['baking']
        }
      };

      setPreparedRecipe(formattedRecipe);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Import Failed",
        description: error.message,
      });
    },
  });

  // Import mutation for text
  const importFromText = useMutation({
    mutationFn: async () => {
      if (!recipeText.trim()) {
        throw new Error('Please enter recipe content');
      }

      const { data, error } = await supabase.functions.invoke('ai-recipe-import', {
        body: {
          type: 'text',
          content: recipeText,
          language
        }
      });

      if (error) throw error;
      if (!data) throw new Error('No data returned from import function');

      return data;
    },
    onSuccess: (data) => {
      // Format categories for our form
      const dietaryRestrictions = data.categories?.dietary_restrictions;
      const cookingMethod = data.categories?.cooking_method;

      const formattedRecipe: RecipeFormData = {
        title: data.title || '',
        description: data.description || '',
        ingredients: Array.isArray(data.ingredients) ? data.ingredients : [],
        instructions: Array.isArray(data.instructions) ? data.instructions : [],
        prep_time: data.prep_time || 0,
        cook_time: data.cook_time || 0,
        estimated_calories: data.estimated_calories || 0,
        servings: data.suggested_portions || 2,
        language,
        categories: {
          meal_type: data.categories?.meal_type || 'dinner',
          dietary_restrictions: Array.isArray(dietaryRestrictions) 
            ? dietaryRestrictions 
            : dietaryRestrictions ? [String(dietaryRestrictions)] : ['none'],
          difficulty_level: data.categories?.difficulty_level || 'medium',
          cuisine_type: data.categories?.cuisine_type || 'Other',
          cooking_method: Array.isArray(cookingMethod)
            ? cookingMethod
            : cookingMethod ? [String(cookingMethod)] : ['baking']
        }
      };

      setPreparedRecipe(formattedRecipe);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Import Failed",
        description: error.message,
      });
    },
  });

  const handleImport = () => {
    setIsProcessing(true);
    if (importType === 'url') {
      importFromUrl.mutate(undefined, {
        onSettled: () => setIsProcessing(false)
      });
    } else {
      importFromText.mutate(undefined, {
        onSettled: () => setIsProcessing(false)
      });
    }
  };

  // When preparedRecipe changes, update formData
  useEffect(() => {
    if (preparedRecipe) {
      Object.entries(preparedRecipe).forEach(([key, value]) => {
        updateFormField(key as keyof RecipeFormData, value);
      });
    }
  }, [preparedRecipe]);

  // Get language label
  const getLanguageOption = (code: string) => {
    return {
      value: code,
      label: SUPPORTED_LANGUAGES[code as keyof typeof SUPPORTED_LANGUAGES] || code
    };
  };

  return (
    <PageLayout>
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => navigate('/recipes')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Recipes
      </Button>

      {!preparedRecipe ? (
        <Card className="overflow-hidden rounded-lg">
          <CardContent className="p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold">Import Recipe</h1>
              <p className="text-gray-500 mt-2">
                Import a recipe from a URL or by pasting recipe text
              </p>
            </div>

            <Tabs defaultValue="url" value={importType} onValueChange={setImportType}>
              <TabsList className="mb-4">
                <TabsTrigger value="url">From URL</TabsTrigger>
                <TabsTrigger value="text">From Text</TabsTrigger>
              </TabsList>
              
              <TabsContent value="url" className="space-y-4">
                <div>
                  <label htmlFor="recipe-url" className="block mb-2 text-sm font-medium">
                    Recipe URL
                  </label>
                  <input
                    id="recipe-url"
                    type="url"
                    className="w-full p-3 border rounded-md"
                    placeholder="https://example.com/recipe"
                    value={recipeUrl}
                    onChange={(e) => setRecipeUrl(e.target.value)}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="text" className="space-y-4">
                <div>
                  <label htmlFor="recipe-text" className="block mb-2 text-sm font-medium">
                    Recipe Text
                  </label>
                  <Textarea
                    id="recipe-text"
                    className="min-h-[300px]"
                    placeholder="Paste your recipe here..."
                    value={recipeText}
                    onChange={(e) => setRecipeText(e.target.value)}
                  />
                </div>
              </TabsContent>

              <div className="my-4">
                <label htmlFor="recipe-language" className="block mb-2 text-sm font-medium">
                  Recipe Language
                </label>
                <select
                  id="recipe-language"
                  className="w-full p-3 border rounded-md"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
                    <option key={code} value={code}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-6">
                <Button
                  onClick={handleImport}
                  disabled={isProcessing || (!recipeUrl.trim() && !recipeText.trim())}
                  className="w-full"
                >
                  {isProcessing ? (
                    <>
                      <LoadingSpinner className="mr-2" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Import Recipe
                    </>
                  )}
                </Button>
              </div>
            </Tabs>

            <div className="mt-6 p-4 bg-blue-50 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium">Tips:</p>
                <ul className="list-disc pl-4 mt-1 space-y-1">
                  <li>For URL imports, make sure the recipe page is publicly accessible</li>
                  <li>When pasting text, include the ingredients and steps for best results</li>
                  <li>The AI will try to extract all recipe details automatically</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </PageLayout>
  );
}
