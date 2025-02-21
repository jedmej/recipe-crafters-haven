import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Image as ImageIcon, Clock, Timer, Flame } from 'lucide-react';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import ImageGenerator from '@/components/ImageGenerator';

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
}

const SUPPORTED_LANGUAGES = {
  en: 'English',
  pl: 'Polish',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian'
} as const;

type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;

export function AIRecipeSearch() {
  const [query, setQuery] = useState('');
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [generateImage, setGenerateImage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recipe, setRecipe] = useState<RecipeData | null>(null);
  const { toast } = useToast();
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const saveRecipeToDatabase = async (recipeData: RecipeData, userId: string) => {
    const { data: savedRecipe, error: insertError } = await supabase
      .from('recipes')
      .insert([{
        title: recipeData.title,
        description: recipeData.description,
        ingredients: recipeData.ingredients,
        instructions: recipeData.instructions,
        prep_time: recipeData.prep_time,
        cook_time: recipeData.cook_time,
        estimated_calories: recipeData.estimated_calories,
        servings: recipeData.suggested_portions,
        suggested_portions: recipeData.suggested_portions,
        portion_size: recipeData.suggested_portions,
        portion_description: recipeData.portion_description || `Serves ${recipeData.suggested_portions}`,
        image_url: recipeData.image_url,
        user_id: userId,
        created_at: new Date().toISOString(),
        language: language,
        source_url: null // AI-generated recipe has no source URL
      }])
      .select()
      .single();

    if (insertError) throw insertError;
    return savedRecipe;
  };

  const saveRecipe = useMutation({
    mutationFn: async (recipeData: RecipeData) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("User not authenticated");
      return await saveRecipeToDatabase(recipeData, session.user.id);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      navigate(`/recipes/${data.id}`);
      toast({
        title: "Recipe saved successfully!",
        description: "The recipe has been added to your collection.",
      });
    },
    onError: (error: Error) => {
      console.error('Save error:', error);
      toast({
        variant: "destructive",
        title: "Save failed",
        description: "We couldn't save this recipe. Please try again.",
      });
    }
  });

  const handleSearch = async () => {
    if (!query.trim()) {
      toast({
        title: 'Please enter a search query',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setRecipe(null);

    try {
      // First, get the recipe in the selected language
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("User not authenticated");

      console.log('Sending request with:', { query, language });
      
      const MAX_RETRIES = 3;
      const BASE_DELAY = 2000; // 2 seconds base delay

      const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      
      // Calculate delay with exponential backoff and jitter
      const getRetryDelay = (attempt: number) => {
        const exponentialDelay = BASE_DELAY * Math.pow(2, attempt - 1);
        const jitter = Math.random() * 1000; // Add up to 1 second of random jitter
        return exponentialDelay + jitter;
      };

      let lastError;
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          if (attempt > 1) {
            const delay = getRetryDelay(attempt - 1);
            console.log(`Attempt ${attempt} - Waiting ${(delay/1000).toFixed(1)} seconds before retry...`);
            await sleep(delay);
          }

          const response = await supabase.functions.invoke('recipe-chat', {
            method: 'POST',
            body: { query, language },
          });

          const { data, error } = response;

          if (error) {
            console.error(`Attempt ${attempt} - Function error details:`, error);
            
            // Check if it's a Gemini overload error
            const errorMessage = error.message || '';
            if (errorMessage.includes('503 Service Unavailable') && 
                errorMessage.includes('model is overloaded')) {
              if (attempt < MAX_RETRIES) {
                console.log(`Attempt ${attempt} - Gemini API overloaded, will retry with exponential backoff`);
                continue;
              }
              throw new Error('The AI service is currently experiencing high traffic. Please try again in a few moments.');
            }

            // For other errors, try to get more details
            if (error instanceof Error) {
              const errorObj = error as any;
              console.error('Full error object:', {
                name: errorObj.name,
                message: errorObj.message,
                context: errorObj.context,
                stack: errorObj.stack,
              });
              
              if (errorObj.context?.response) {
                try {
                  const errorResponse = await errorObj.context.response.json();
                  console.error('Error response body:', errorResponse);
                  
                  // Extract the actual error message from the Edge Function response
                  const edgeFunctionError = errorResponse.error || errorResponse.message;
                  if (edgeFunctionError) {
                    console.error('Edge Function error:', edgeFunctionError);
                    throw new Error(edgeFunctionError);
                  }
                  
                  throw new Error(errorResponse.message || errorResponse.error || 'Edge Function error');
                } catch (parseError) {
                  console.error('Error parsing response:', parseError);
                  console.error('Raw response:', errorObj.context?.response);
                }
              }
            }
            lastError = error;
            if (attempt < MAX_RETRIES) {
              await sleep(getRetryDelay(attempt));
              continue;
            }
            throw error;
          }

          console.log('Received response:', data);

          if (data?.success && data?.data) {
            let recipeData = data.data;

            // If image generation is enabled, get the recipe in English for image generation
            if (generateImage && language !== 'en') {
              // Add retry logic for the English translation request as well
              for (let translationAttempt = 1; translationAttempt <= MAX_RETRIES; translationAttempt++) {
                try {
                  const { data: englishData } = await supabase.functions.invoke('recipe-chat', {
                    method: 'POST',
                    body: { query, language: 'en' },
                  });
                  
                  if (englishData?.success && englishData?.data) {
                    setRecipe(recipeData);
                    setIsGeneratingImage(true);
                    break;
                  }
                } catch (translationError) {
                  if (translationAttempt === MAX_RETRIES) throw translationError;
                  await sleep(getRetryDelay(translationAttempt));
                }
              }
            } else if (generateImage) {
              setRecipe(recipeData);
              setIsGeneratingImage(true);
            } else {
              setRecipe(recipeData);
            }
            return; // Success! Exit the retry loop
          } else {
            throw new Error(data?.error || 'Failed to get recipe');
          }
        } catch (error) {
          lastError = error;
          if (attempt === MAX_RETRIES) break;
          await sleep(getRetryDelay(attempt));
        }
      }

      // If we get here, all retries failed
      console.error('All retry attempts failed. Last error:', lastError);
      toast({
        title: 'Error',
        description: lastError instanceof Error ? 
          (lastError.message.includes('model is overloaded') ? 
            'The AI service is currently busy. Please try again in a few moments.' : 
            lastError.message) : 
          'Failed to search for recipe',
        variant: 'destructive',
      });
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to search for recipe',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (!recipe) return;
    saveRecipe.mutate(recipe);
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">AI Recipe Search</h1>
          
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1">
                <Input
                  placeholder="e.g., Find a vegan lasagna recipe"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full text-lg"
                />
              </div>
              <div className="flex flex-col sm:flex-row md:flex-row gap-3 sm:w-auto">
                <Select
                  value={language}
                  onValueChange={(value: LanguageCode) => setLanguage(value)}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
                      <SelectItem key={code} value={code}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleSearch} 
                  disabled={isLoading || isGeneratingImage}
                  className="w-full sm:w-auto"
                >
                  {isLoading || isGeneratingImage ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isGeneratingImage ? 'Generating Image...' : 'Searching...'}
                    </>
                  ) : (
                    'Search'
                  )}
                </Button>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="generate-image"
                checked={generateImage}
                onCheckedChange={setGenerateImage}
              />
              <Label htmlFor="generate-image" className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Generate recipe image
              </Label>
            </div>
          </div>
        </div>
      </Card>

      {recipe && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
          <div className="md:col-span-2 lg:col-span-8">
            <Card className="overflow-hidden h-full">
              <div className="p-6">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">{recipe.title}</h2>
                    <p className="text-gray-600 mt-3 break-words whitespace-pre-wrap">{recipe.description}</p>
                  </div>
                  
                  {recipe.image_url && (
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                      <img
                        src={recipe.image_url}
                        alt={recipe.title}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>

          <div className="md:col-span-2 lg:col-span-4">
            <Card>
              <div className="p-6">
                <div className="flex justify-end">
                  <Button 
                    onClick={handleSave}
                    disabled={saveRecipe.isPending}
                    className="w-full"
                  >
                    {saveRecipe.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Recipe'
                    )}
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="mt-6">
              <div className="p-6">
                <div className="grid grid-cols-3 lg:grid-cols-1 gap-4">
                  <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
                    <Clock className="h-6 w-6 text-gray-500 mb-2" />
                    <p className="text-sm text-gray-500">Prep Time</p>
                    <p className="text-lg font-semibold">{recipe.prep_time} min</p>
                  </div>
                  <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
                    <Timer className="h-6 w-6 text-gray-500 mb-2" />
                    <p className="text-sm text-gray-500">Cook Time</p>
                    <p className="text-lg font-semibold">{recipe.cook_time} min</p>
                  </div>
                  <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
                    <Flame className="h-6 w-6 text-gray-500 mb-2" />
                    <p className="text-sm text-gray-500">Calories</p>
                    <p className="text-lg font-semibold">{recipe.estimated_calories} kcal</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="md:col-span-1 lg:col-span-6">
            <Card className="h-full">
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-6">Ingredients</h3>
                <ul className="list-none space-y-4">
                  {recipe.ingredients.map((ingredient, index) => (
                    <li key={index} className="flex items-center gap-4">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-500 flex-shrink-0" />
                      <span className="text-gray-700 break-words flex-1">{ingredient}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          </div>

          <div className="md:col-span-1 lg:col-span-6">
            <Card className="h-full">
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-6">Instructions</h3>
                <ol className="list-none space-y-8">
                  {recipe.instructions.map((instruction, index) => (
                    <li key={index} className="flex gap-4">
                      <span className="text-gray-700 font-medium">{index + 1}.</span>
                      <span className="text-gray-700 break-words whitespace-pre-wrap flex-1">{instruction}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </Card>
          </div>
        </div>
      )}

      {generateImage && recipe && !recipe.image_url && (
        <ImageGenerator
          prompt={`${recipe.title}: ${recipe.description}`}
          embedded={true}
          onImageGenerated={(imageUrl) => {
            setRecipe(prev => prev ? { ...prev, image_url: imageUrl } : null);
            setIsGeneratingImage(false);
          }}
        />
      )}
    </div>
  );
} 