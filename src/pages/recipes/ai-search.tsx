
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, ArrowLeft, Plus, Clock, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RecipeData {
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  prep_time?: number;
  cook_time?: number;
  estimated_calories?: number;
}

export default function AIRecipeSearchPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [suggestedRecipe, setSuggestedRecipe] = useState<RecipeData | null>(null);

  const searchRecipe = useMutation({
    mutationFn: async (query: string) => {
      const response = await supabase.functions.invoke('ai-recipe-search', {
        body: { query }
      });

      if (response.error) {
        console.error('Search error:', response.error);
        throw new Error(response.error.message || 'Failed to search for recipes');
      }
      
      if (!response.data) {
        throw new Error('No recipe data received');
      }

      return response.data as RecipeData;
    },
    onSuccess: (data) => {
      setSuggestedRecipe(data);
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
      if (!suggestedRecipe) throw new Error("No recipe to save");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from('recipes')
        .insert([{
          ...suggestedRecipe,
          user_id: user.id,
          servings: 4 // Default servings
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
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">What would you like to cook?</label>
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., Find a vegan lasagna recipe"
                required
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                Ask for any recipe and our AI will help you find it
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isSearching}>
              {isSearching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                "Search Recipe"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {suggestedRecipe && (
        <Card>
          <CardHeader>
            <CardTitle>{suggestedRecipe.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground">{suggestedRecipe.description}</p>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {suggestedRecipe.prep_time && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>Prep: {suggestedRecipe.prep_time} mins</span>
                </div>
              )}
              {suggestedRecipe.cook_time && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>Cook: {suggestedRecipe.cook_time} mins</span>
                </div>
              )}
              {suggestedRecipe.estimated_calories && (
                <div className="flex items-center gap-1">
                  <Flame className="h-4 w-4" />
                  <span>{suggestedRecipe.estimated_calories} cal total</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Ingredients:</h3>
              <ul className="list-disc pl-5 space-y-1">
                {suggestedRecipe.ingredients.map((ingredient, index) => (
                  <li key={index}>{ingredient}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Instructions:</h3>
              <ol className="list-decimal pl-5 space-y-1">
                {suggestedRecipe.instructions.map((instruction, index) => (
                  <li key={index}>{instruction}</li>
                ))}
              </ol>
            </div>

            <Button 
              onClick={() => saveRecipe.mutate()}
              className="w-full gap-2"
              disabled={saveRecipe.isPending}
            >
              {saveRecipe.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Save Recipe
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
