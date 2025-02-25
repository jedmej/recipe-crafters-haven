import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { ArrowLeft, Bot, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RecipeImportForm } from "@/components/recipes/RecipeImportForm";
import { RecipeDisplay } from "@/components/recipes/RecipeDisplay";
import { RecipeData } from "@/types/recipe";
import { scaleRecipe } from "@/utils/recipe-scaling";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MeasurementSystem } from "@/lib/types";

export default function ImportRecipePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State consolidation
  const [formState, setFormState] = useState({
    activeTab: "url",
    url: "",
    language: "en" as string,
    isImporting: false
  });
  
  const [recipeState, setRecipeState] = useState<{
    importedRecipe: RecipeData | null,
    scaledRecipe: RecipeData | null,
    chosenPortions: number,
    measurementSystem: MeasurementSystem
  }>({
    importedRecipe: null,
    scaledRecipe: null,
    chosenPortions: 0,
    measurementSystem: 'metric'
  });
  
  // Destructure for convenience
  const { activeTab, url, language, isImporting } = formState;
  const { importedRecipe, scaledRecipe, chosenPortions, measurementSystem } = recipeState;

  // Update recipe scaling when portions change
  useEffect(() => {
    if (importedRecipe && chosenPortions) {
      const scaled = scaleRecipe(
        importedRecipe, 
        chosenPortions, 
        importedRecipe.suggested_portions
      );
      setRecipeState(prev => ({ ...prev, scaledRecipe: scaled }));
    }
  }, [importedRecipe, chosenPortions]);

  // Import recipe mutation
  const importRecipe = useMutation({
    mutationFn: async (url: string) => {
      const response = await supabase.functions.invoke('ai-recipe-import', {
        body: { url, targetLanguage: language }
      });

      if (response.error) {
        console.error('Import error:', response.error);
        throw new Error(response.error.message || 'Failed to import recipe');
      }

      return response.data as RecipeData;
    },
    onSuccess: (data) => {
      setRecipeState({
        importedRecipe: data,
        scaledRecipe: data,
        chosenPortions: data.suggested_portions,
        measurementSystem: 'metric'
      });
      
      toast({
        title: "Recipe imported",
        description: "Successfully imported and translated the recipe.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Import failed",
        description: error.message || "Failed to import recipe. Please try again.",
      });
    }
  });

  // Save recipe mutation
  const saveRecipe = useMutation({
    mutationFn: async () => {
      if (!scaledRecipe) throw new Error("No recipe to save");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from('recipes')
        .insert([{
          ...scaledRecipe,
          user_id: user.id,
          suggested_portions: importedRecipe?.suggested_portions,
          portion_size: chosenPortions,
          language,
          source_url: url
        }])
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
        description: error.message || "Failed to save recipe. Please try again.",
      });
    }
  });

  // Handle form value updates
  const updateFormState = (key: string, value: any) => {
    setFormState(prev => ({ ...prev, [key]: value }));
  };
  
  // Update portions and scale recipe
  const updatePortions = (portions: number) => {
    if (!importedRecipe) return;
    setRecipeState(prev => ({ ...prev, chosenPortions: portions }));
  };
  
  // Toggle measurement system
  const toggleMeasurementSystem = () => {
    setRecipeState(prev => ({
      ...prev,
      measurementSystem: prev.measurementSystem === 'metric' ? 'imperial' : 'metric'
    }));
  };
  
  // Handle import submission
  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    updateFormState('isImporting', true);
    setRecipeState({
      importedRecipe: null,
      scaledRecipe: null,
      chosenPortions: 0,
      measurementSystem: 'metric'
    });
    
    try {
      await importRecipe.mutateAsync(url);
    } finally {
      updateFormState('isImporting', false);
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

        {/* Recipe Import Form */}
        <Card className="mb-8">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <CardTitle>Import Recipe</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              Import recipes from various sources with AI assistance
            </p>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={val => updateFormState('activeTab', val)}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="url">Import from URL</TabsTrigger>
                <TabsTrigger value="text">Import from Text</TabsTrigger>
              </TabsList>
              <TabsContent value="url">
                <RecipeImportForm
                  url={url}
                  language={language}
                  isImporting={isImporting}
                  onUrlChange={val => updateFormState('url', val)}
                  onLanguageChange={val => updateFormState('language', val)}
                  onSubmit={handleImport}
                />
              </TabsContent>
              <TabsContent value="text">
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Text import feature coming soon...
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Recipe Display */}
        {importedRecipe && scaledRecipe && (
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-gray-50/50">
              <CardTitle className="flex items-center justify-between">
                <span>{importedRecipe.title}</span>
                <Button
                  onClick={() => saveRecipe.mutate()}
                  disabled={saveRecipe.isPending}
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
              <RecipeDisplay
                recipe={importedRecipe}
                scaledRecipe={scaledRecipe}
                chosenPortions={chosenPortions}
                onPortionsChange={updatePortions}
                onSave={() => saveRecipe.mutate()}
                isSaving={saveRecipe.isPending}
                measurementSystem={measurementSystem}
                onMeasurementSystemChange={toggleMeasurementSystem}
              />
            </CardContent>
            {url && (
              <CardFooter className="bg-gray-50/50 border-t">
                <p className="text-sm text-muted-foreground">
                  Imported from:{' '}
                  <a
                    href={url}
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

        {/* Loading Indicator */}
        {isImporting && (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Importing and translating recipe...</p>
          </div>
        )}
      </div>
    </div>
  );
} 