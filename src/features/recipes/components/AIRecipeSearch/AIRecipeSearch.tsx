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
import { useImageGeneration } from '@/features/recipes/hooks/useImageGeneration';

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
  const { generateImage: generateRecipeImage, isLoading: isImageLoading } = useImageGeneration();
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
      const { data, error } = await supabase.functions.invoke('recipe-chat', {
        body: { query, language },
      });

      if (error) throw error;

      if (data.success && data.data) {
        let recipeData = data.data;

        // If image generation is enabled, get the recipe in English for image generation
        if (generateImage && language !== 'en') {
          const { data: englishData } = await supabase.functions.invoke('recipe-chat', {
            body: { query, language: 'en' },
          });
          
          if (englishData?.success && englishData?.data) {
            const imagePrompt = `Generate a photorealistic image of ${englishData.data.title}: ${englishData.data.description}`;
            const imageUrl = await generateRecipeImage(imagePrompt);
            if (imageUrl) {
              recipeData = { ...recipeData, image_url: imageUrl };
            }
          }
        } else if (generateImage) {
          // If already in English, generate image directly
          const imagePrompt = `Generate a photorealistic image of ${recipeData.title}: ${recipeData.description}`;
          const imageUrl = await generateRecipeImage(imagePrompt);
          if (imageUrl) {
            recipeData = { ...recipeData, image_url: imageUrl };
          }
        }

        setRecipe(recipeData);
      } else {
        throw new Error(data.error || 'Failed to get recipe');
      }
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
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="e.g., Find a vegan lasagna recipe"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full"
                />
              </div>
              <Select
                value={language}
                onValueChange={(value: LanguageCode) => setLanguage(value)}
              >
                <SelectTrigger className="w-[180px]">
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
              <Button onClick={handleSearch} disabled={isLoading || isImageLoading}>
                {isLoading || isImageLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isImageLoading ? 'Generating Image...' : 'Searching...'}
                  </>
                ) : (
                  'Search'
                )}
              </Button>
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
                <div className="space-y-4">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">{recipe.title}</h2>
                    <p className="text-gray-600 mt-2">{recipe.description}</p>
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
                <h3 className="text-xl font-semibold mb-4">Ingredients</h3>
                <ul className="list-disc list-inside space-y-2">
                  {recipe.ingredients.map((ingredient, index) => (
                    <li key={index} className="text-gray-700">{ingredient}</li>
                  ))}
                </ul>
              </div>
            </Card>
          </div>

          <div className="md:col-span-1 lg:col-span-6">
            <Card className="h-full">
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-4">Instructions</h3>
                <ol className="list-decimal list-inside space-y-4">
                  {recipe.instructions.map((instruction, index) => (
                    <li key={index} className="text-gray-700">
                      <span className="ml-2">{instruction}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
} 