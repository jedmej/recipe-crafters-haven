
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RecipeSearchForm } from "@/components/recipes/RecipeSearchForm";
import { RecipeDisplay } from "@/components/recipes/RecipeDisplay";
import { RecipeData } from "@/types/recipe";
import { scaleRecipe } from "@/utils/recipe-scaling";

export default function AIRecipeSearchPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState<string>("pl");
  const [isSearching, setIsSearching] = useState(false);
  const [suggestedRecipe, setSuggestedRecipe] = useState<RecipeData | null>(null);
  const [chosenPortions, setChosenPortions] = useState<number>(0);
  const [scaledRecipe, setScaledRecipe] = useState<RecipeData | null>(null);

  useEffect(() => {
    if (suggestedRecipe && chosenPortions > 0) {
      const scaled = scaleRecipe(
        suggestedRecipe,
        chosenPortions,
        suggestedRecipe.suggested_portions
      );
      setScaledRecipe(scaled);
    }
  }, [chosenPortions, suggestedRecipe]);

  const searchRecipe = useMutation({
    mutationFn: async (query: string) => {
      const response = await supabase.functions.invoke('ai-recipe-search', {
        body: { query, language }
      });

      if (response.error) {
        console.error('Search error:', response.error);
        try {
          const errorBody = JSON.parse(response.error.message);
          if (errorBody.error) {
            throw new Error(errorBody.error);
          }
        } catch (e) {
          throw new Error(response.error.message || 'Failed to search for recipes');
        }
      }
      
      if (!response.data) {
        throw new Error('No recipe data received');
      }

      return { ...response.data, language } as RecipeData;
    },
    onSuccess: (data) => {
      setSuggestedRecipe(data);
      setChosenPortions(data.suggested_portions);
      setScaledRecipe(data);
      toast({
        title: "Recipe found",
        description: "Here's a recipe suggestion based on your search.",
      });
    },
    onError: (error: Error) => {
      console.error('Search mutation error:', error);
      toast({
        variant: "destructive",
        title: "Search failed",
        description: error.message || "Failed to search for recipes. Please try again.",
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
          suggested_portions: suggestedRecipe?.suggested_portions,
          portion_size: chosenPortions,
          language
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

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setSuggestedRecipe(null);
    setScaledRecipe(null);
    try {
      await searchRecipe.mutateAsync(query);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => navigate("/recipes")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Recipes
      </Button>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>AI Recipe Search</CardTitle>
        </CardHeader>
        <CardContent>
          <RecipeSearchForm
            query={query}
            language={language}
            isSearching={isSearching}
            onQueryChange={setQuery}
            onLanguageChange={setLanguage}
            onSubmit={handleSearch}
          />
        </CardContent>
      </Card>

      {suggestedRecipe && scaledRecipe && (
        <Card>
          <CardHeader>
            <CardTitle>{suggestedRecipe.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <RecipeDisplay
              recipe={suggestedRecipe}
              scaledRecipe={scaledRecipe}
              chosenPortions={chosenPortions}
              onPortionsChange={setChosenPortions}
              onSave={() => saveRecipe.mutate()}
              isSaving={saveRecipe.isPending}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
