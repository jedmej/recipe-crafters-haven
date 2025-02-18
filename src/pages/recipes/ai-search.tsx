
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, ArrowLeft, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function AIRecipeSearchPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [suggestedRecipe, setSuggestedRecipe] = useState<{
    title: string;
    description: string;
    ingredients: string[];
    instructions: string[];
  } | null>(null);

  const searchRecipe = useMutation({
    mutationFn: async (query: string) => {
      const { data, error } = await supabase.functions.invoke('ai-recipe-search', {
        body: { query },
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message);
      }
      if (!data) throw new Error('No recipe data returned');
      return data;
    },
    onSuccess: (data) => {
      setSuggestedRecipe(data);
    },
    onError: (error: Error) => {
      let message = "Failed to generate recipe. Please try again.";
      
      if (error.message.includes('503') || error.message.includes('overloaded')) {
        message = "The recipe service is currently busy. Please try again in a few moments.";
      }
      
      toast({
        variant: "destructive",
        title: "Search failed",
        description: message,
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
            >
              <Plus className="h-4 w-4" />
              Save Recipe
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
