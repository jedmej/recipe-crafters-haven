import { useState } from "react";
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
import { ImageUploadOrGenerate } from "@/components/recipes/ImageUploadOrGenerate";
import { MeasurementSystem } from "@/lib/types";

export default function AIRecipeImportPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [url, setUrl] = useState("");
  const [language, setLanguage] = useState<string>("en");
  const [isImporting, setIsImporting] = useState(false);
  const [importedRecipe, setImportedRecipe] = useState<RecipeData | null>(null);
  const [chosenPortions, setChosenPortions] = useState<number>(0);
  const [scaledRecipe, setScaledRecipe] = useState<RecipeData | null>(null);
  const [measurementSystem, setMeasurementSystem] = useState<MeasurementSystem>('metric');

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
      setImportedRecipe(data);
      setChosenPortions(data.suggested_portions);
      setScaledRecipe(data);
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
        description: error.message || "Failed to save the recipe. Please try again.",
      });
    }
  });

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsImporting(true);
    setImportedRecipe(null);
    setScaledRecipe(null);
    try {
      await importRecipe.mutateAsync(url);
    } finally {
      setIsImporting(false);
    }
  };

  const handleImageSelected = (imageUrl: string) => {
    // Implementation of handleImageSelected function
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
              <CardTitle>AI Recipe Import</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              Import and translate recipes from any website
            </p>
          </CardHeader>
          <CardContent>
            <RecipeImportForm
              url={url}
              language={language}
              isImporting={isImporting}
              onUrlChange={setUrl}
              onLanguageChange={setLanguage}
              onSubmit={handleImport}
            />
          </CardContent>
        </Card>

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
                onPortionsChange={setChosenPortions}
                onSave={() => saveRecipe.mutate()}
                isSaving={saveRecipe.isPending}
              />
            </CardContent>
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
          </Card>
        )}

        {isImporting && (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Importing and translating recipe...</p>
          </div>
        )}

        <ImageUploadOrGenerate
          onImageSelected={handleImageSelected}
          title={importedRecipe?.title}
          disabled={isImporting}
          toggleMode={true}
        />
      </div>
    </div>
  );
} 