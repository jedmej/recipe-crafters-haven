import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { ArrowLeft, Bot, Loader2, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RecipeSearchForm } from "@/components/recipes/RecipeSearchForm";
import { RecipeDisplay } from "@/components/recipes/RecipeDisplay";
import { RecipeData } from "@/types/recipe";
import { scaleRecipe } from "@/utils/recipe-scaling";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch"
import ImageGenerator from '@/components/ImageGenerator'
import { ImageUploadOrGenerate } from "@/components/recipes/ImageUploadOrGenerate";

export default function AIRecipeSearchPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState<string>("pl");
  const [isSearching, setIsSearching] = useState(false);
  const [suggestedRecipe, setSuggestedRecipe] = useState<RecipeData | null>(null);
  const [chosenPortions, setChosenPortions] = useState<number>(0);
  const [generateImage, setGenerateImage] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [measurementSystem, setMeasurementSystem] = useState<'metric' | 'imperial'>('metric');
  const recipeToGenerateImage = useRef<string | null>(null);

  // Memoize the scaled recipe calculation
  const scaledRecipe = useMemo(() => {
    if (!suggestedRecipe || chosenPortions <= 0) return null;
    return scaleRecipe(
      suggestedRecipe,
      chosenPortions,
      suggestedRecipe.suggested_portions
    );
  }, [suggestedRecipe, chosenPortions]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (!session) {
        // Handle user logout or session expiration
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const searchRecipe = useMutation({
    mutationFn: async (query: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("User not authenticated");
      }

      const API_URL = 'https://yorijihyeahhfprgjkvp.supabase.co/functions/v1/ai-recipe-search';
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ query, language }),
      });

      if (!response.ok) {
        const errorDetails = await response.text();
        throw new Error(`Error ${response.status}: ${errorDetails}`);
      }

      const data = await response.json();

      // Add type safety for API response
      interface AIRecipeResponse {
        title: string;
        description: string;
        ingredients: string[];
        instructions: string[];
        suggested_portions: number;
        source_url?: string;
        cook_time?: number;
        prep_time?: number;
        estimated_calories?: number;
        portion_description?: string;
      }

      const apiResponse = data as AIRecipeResponse;

      // Create recipe with type safety and default values
      const recipe: RecipeData = {
        title: apiResponse.title,
        description: apiResponse.description,
        ingredients: apiResponse.ingredients,
        instructions: apiResponse.instructions,
        suggested_portions: apiResponse.suggested_portions,
        source_url: apiResponse.source_url ?? null,
        cook_time: apiResponse.cook_time ?? null,
        prep_time: apiResponse.prep_time ?? null,
        estimated_calories: apiResponse.estimated_calories ?? null,
        portion_description: apiResponse.portion_description ?? `Serves ${apiResponse.suggested_portions}`,
      };

      return recipe;
    },
    onSuccess: (data) => {
      setSuggestedRecipe(data);
      setChosenPortions(data.suggested_portions);
      toast({
        title: "Recipe found",
        description: "Here's the recipe suggestion based on your search.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Search failed",
        description: error.message,
      });
    },
  });

  const saveRecipe = useMutation({
    mutationFn: async () => {
      if (!scaledRecipe) throw new Error("No recipe to save");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Create a properly typed object that matches the database schema
      const recipeToSave = {
        title: scaledRecipe.title,
        description: scaledRecipe.description,
        ingredients: scaledRecipe.ingredients,
        instructions: scaledRecipe.instructions,
        cook_time: scaledRecipe.cook_time,
        prep_time: scaledRecipe.prep_time,
        estimated_calories: scaledRecipe.estimated_calories,
        suggested_portions: scaledRecipe.suggested_portions,
        portion_size: chosenPortions,
        source_url: scaledRecipe.source_url,
        image_url: scaledRecipe.imageUrl, // Map imageUrl to image_url for database
        language: language,
        user_id: user.id // Required field in database
      };

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
        title: "Recipe saved",
        description: "The recipe has been added to your collection.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Save failed",
        description: error.message || "Failed to save the recipe. Please try again.",
      });
    }
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setSuggestedRecipe(null);
    
    try {
      const recipe = await searchRecipe.mutateAsync(query);
      
      if (generateImage) {
        setIsGeneratingImage(true);
        recipeToGenerateImage.current = recipe.title;
      }
      
      setSuggestedRecipe(recipe);
      setChosenPortions(recipe.suggested_portions);
    } catch (error) {
      console.error('Search error:', error);
      toast({
        variant: "destructive",
        title: "Search failed",
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Add handler for when image generation is complete
  const handleImageGenerated = (imageUrl: string) => {
    setIsGeneratingImage(false);
    if (suggestedRecipe) {
      setSuggestedRecipe({
        ...suggestedRecipe,
        imageUrl: imageUrl
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="outline"
          onClick={() => navigate("/recipes")}
          className="mb-6 hover:shadow-sm transition-all"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Recipes
        </Button>

        <Card className="mb-8">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <CardTitle>AI Recipe Search</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              Describe what you'd like to cook and our AI will suggest a recipe
            </p>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <ImageUploadOrGenerate
                onImageSelected={(imageUrl) => {
                  if (suggestedRecipe) {
                    setSuggestedRecipe({
                      ...suggestedRecipe,
                      imageUrl: imageUrl
                    });
                  }
                }}
                title={suggestedRecipe?.title}
                disabled={isSearching}
                toggleMode={true}
              />
            </div>
            <RecipeSearchForm
              query={query}
              language={language}
              isSearching={isSearching || isGeneratingImage}
              onQueryChange={setQuery}
              onLanguageChange={setLanguage}
              onSubmit={handleSearch}
            />
          </CardContent>
        </Card>

        {/* Update the ImageGenerator usage */}
        {isGeneratingImage && recipeToGenerateImage.current && (
          <ImageGenerator
            prompt={recipeToGenerateImage.current}
            onImageGenerated={handleImageGenerated}
            embedded={true}
          />
        )}

        {(isSearching || isGeneratingImage) && (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">
              {isGeneratingImage 
                ? "Generating image for your recipe..." 
                : "Searching for the perfect recipe..."}
            </p>
          </div>
        )}

        {suggestedRecipe && scaledRecipe && (
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-gray-50/50">
              <CardTitle className="flex items-center justify-between">
                <span>{suggestedRecipe.title}</span>
                <Button
                  onClick={() => saveRecipe.mutate()}
                  disabled={saveRecipe.isPending || isGeneratingImage}
                  className="ml-4"
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
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="relative mb-6">
                {suggestedRecipe.imageUrl ? (
                  <>
                    <img
                      src={suggestedRecipe.imageUrl}
                      alt={suggestedRecipe.title}
                      className="w-full max-w-2xl rounded-lg shadow-md mx-auto"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => setIsGeneratingImage(true)}
                      disabled={isGeneratingImage}
                    >
                      {isGeneratingImage ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <ImageIcon className="mr-2 h-4 w-4" />
                          Replace Image
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <div className="w-full max-w-2xl mx-auto p-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
                    {isGeneratingImage ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <p className="text-sm text-muted-foreground">Generating Recipe Image...</p>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => setIsGeneratingImage(true)}
                        disabled={isGeneratingImage}
                      >
                        <ImageIcon className="mr-2 h-4 w-4" />
                        Generate Recipe Image
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {isGeneratingImage && (
                <div className="hidden">
                  <ImageGenerator
                    prompt={suggestedRecipe.title}
                    onImageGenerated={handleImageGenerated}
                    embedded={true}
                  />
                </div>
              )}

              <RecipeDisplay
                recipe={suggestedRecipe}
                scaledRecipe={scaledRecipe}
                chosenPortions={chosenPortions}
                onPortionsChange={setChosenPortions}
                onSave={() => saveRecipe.mutate()}
                isSaving={saveRecipe.isPending}
                measurementSystem={measurementSystem}
                onMeasurementSystemChange={() => setMeasurementSystem(prev => prev === 'metric' ? 'imperial' : 'metric')}
              />
            </CardContent>
            {suggestedRecipe.source_url && (
              <CardFooter className="bg-gray-50/50 border-t">
                <p className="text-sm text-muted-foreground">
                  Recipe inspired by:{' '}
                  <a
                    href={suggestedRecipe.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Original Source
                  </a>
                </p>
              </CardFooter>
            )}
          </Card>
        )}

        {!isSearching && !suggestedRecipe && query && (
          <div className="text-center py-12">
            <Bot className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Recipe Found</h3>
            <p className="text-gray-600">
              Try adjusting your search terms or try a different query
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
