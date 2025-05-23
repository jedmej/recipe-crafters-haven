
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageLayout } from "./PageLayout";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SUPPORTED_LANGUAGES } from "@/types/recipe";
import { RecipeDisplay } from "@/components/recipes/RecipeDisplay";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useState as useUserPreferencesState } from 'react';
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { MeasurementSystem } from "../../types";

export function ImportRecipeContainer() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { preferences } = useUserPreferences();
  const [url, setUrl] = useState("");
  const [recipeData, setRecipeData] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [measurementSystem, setMeasurementSystem] = useState<MeasurementSystem>(
    preferences.measurementSystem || 'metric'
  );
  const [language, setLanguage] = useState<string>(
    preferences.language || 'en'
  );
  const [servings, setServings] = useState<number>(2);

  // Import recipe mutation
  const importMutation = useMutation({
    mutationFn: async (url: string) => {
      setIsGenerating(true);
      
      try {
        const { data, error } = await supabase.functions.invoke("import-recipe", {
          body: { url, language, measurementSystem },
        });

        if (error) {
          throw new Error(error.message);
        }

        if (!data) {
          throw new Error("Failed to import the recipe. Please try another URL.");
        }
        
        return data;
      } catch (error) {
        console.error("Error importing recipe:", error);
        throw error;
      } finally {
        setIsGenerating(false);
      }
    },
    onSuccess: (data) => {
      setRecipeData(data);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
    },
  });

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url) {
      toast({
        variant: "destructive",
        title: "URL Required",
        description: "Please enter a recipe URL to import.",
      });
      return;
    }
    
    try {
      // Validate URL
      new URL(url);
      importMutation.mutate(url);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Invalid URL",
        description: "Please enter a valid URL.",
      });
    }
  };

  // Save recipe mutation
  const saveRecipeMutation = useMutation({
    mutationFn: async () => {
      if (!recipeData) return null;
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("You must be logged in to save recipes");
      
      // Prepare recipe data for database
      const recipe = {
        title: recipeData.title,
        description: recipeData.description || "",
        ingredients: recipeData.ingredients || [],
        instructions: recipeData.instructions || [],
        prep_time: recipeData.prep_time || 0,
        cook_time: recipeData.cook_time || 0,
        estimated_calories: recipeData.estimated_calories || 0,
        servings: recipeData.servings || servings,
        suggested_portions: recipeData.servings || servings,
        image_url: recipeData.image_url,
        source_url: url,
        language: language,
        user_id: session.user.id,
        portion_description: "serving",
        categories: recipeData.categories || {
          meal_type: "dinner",
          dietary_restrictions: "none",
          difficulty_level: "medium",
          cuisine_type: "Other",
          cooking_method: "other",
        },
      };
      
      const { data, error } = await supabase
        .from("recipes")
        .insert([recipe])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data?.id) {
        toast({
          title: "Recipe Saved",
          description: "The recipe has been imported and saved successfully!",
        });
        navigate(`/recipes/${data.id}`);
      }
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save recipe",
      });
    },
  });

  const findLanguageLabel = (value: string) => {
    const language = SUPPORTED_LANGUAGES.find(lang => lang.value === value);
    return language ? language.label : value;
  };

  const handleToggleMeasurementSystem = () => {
    setMeasurementSystem(prev => prev === 'metric' ? 'imperial' : 'metric');
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

      {!recipeData ? (
        <Card className="overflow-hidden rounded-[48px] max-w-xl mx-auto">
          <CardContent className="p-8">
            <div className="flex flex-col gap-8">
              <div>
                <h1 className="text-3xl font-bold mb-2">Import Recipe from URL</h1>
                <p className="text-muted-foreground">
                  Enter the URL of a recipe you'd like to import. We'll extract the
                  recipe details and allow you to save it to your collection.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Recipe URL</label>
                  <Input
                    type="url"
                    placeholder="https://example.com/recipe"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    disabled={isGenerating}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Language</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      disabled={isGenerating}
                    >
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <option key={lang.value} value={lang.value}>
                          {lang.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Measurement System</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      value={measurementSystem}
                      onChange={(e) => setMeasurementSystem(e.target.value as MeasurementSystem)}
                      disabled={isGenerating}
                    >
                      <option value="metric">Metric (g, ml)</option>
                      <option value="imperial">Imperial (oz, cups)</option>
                    </select>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isGenerating || !url}
                >
                  {isGenerating ? (
                    <>
                      <LoadingSpinner size={20} className="mr-2" />
                      Importing Recipe...
                    </>
                  ) : (
                    "Import Recipe"
                  )}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => saveRecipeMutation.mutate()}
              disabled={saveRecipeMutation.isPending}
              className="mb-4"
            >
              {saveRecipeMutation.isPending ? (
                <>
                  <LoadingSpinner size={16} className="mr-2" />
                  Saving Recipe...
                </>
              ) : (
                "Save Recipe"
              )}
            </Button>
          </div>

          <RecipeDisplay
            recipe={{
              ...recipeData,
              id: "temp-id", // Temporary ID for the preview
              imageUrl: recipeData.image_url,
              language: language
            }}
            scaledRecipe={{
              ...recipeData,
              id: "temp-id",
              imageUrl: recipeData.image_url,
              language: language
            }}
            chosenPortions={servings}
            onPortionsChange={setServings}
            onSave={() => saveRecipeMutation.mutate()}
            isSaving={saveRecipeMutation.isPending}
            measurementSystem={measurementSystem}
            onMeasurementSystemChange={handleToggleMeasurementSystem}
            onEditOrGenerate={() => {}} // No edit needed for preview
            onBack={() => setRecipeData(null)}
          />
        </div>
      )}
    </PageLayout>
  );
}
