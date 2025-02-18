import { useState, useEffect } from "react";
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
  suggested_portions: number;
  portion_description: string;
}

interface ScaledIngredient {
  quantity: number;
  unit: string;
  ingredient: string;
  originalText: string;
}

export default function AIRecipeSearchPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [suggestedRecipe, setSuggestedRecipe] = useState<RecipeData | null>(null);
  const [chosenPortions, setChosenPortions] = useState<number>(0);
  const [scaledRecipe, setScaledRecipe] = useState<RecipeData | null>(null);

  const parseIngredient = (text: string): ScaledIngredient => {
    const match = text.match(/^([\d.\/]+)\s*([a-zA-Z]+)?\s+(.+)$/);
    if (match) {
      const [, quantity, unit, ingredient] = match;
      const numericQuantity = quantity.includes('/') 
        ? eval(quantity)
        : parseFloat(quantity);
      return {
        quantity: numericQuantity,
        unit: unit || '',
        ingredient,
        originalText: text
      };
    }
    return {
      quantity: 1,
      unit: '',
      ingredient: text,
      originalText: text
    };
  };

  const scaleRecipe = (recipe: RecipeData, newPortions: number, originalPortions: number) => {
    if (!recipe || newPortions <= 0 || originalPortions <= 0) return recipe;

    const scaleFactor = newPortions / originalPortions;

    const scaledIngredients = recipe.ingredients.map(ing => {
      const parsed = parseIngredient(ing);
      if (parsed.quantity && parsed.unit) {
        const scaledQuantity = parsed.quantity * scaleFactor;
        return `${scaledQuantity.toFixed(2)} ${parsed.unit} ${parsed.ingredient}`;
      }
      return ing;
    });

    const scaledPrep = recipe.prep_time ? Math.round(recipe.prep_time * Math.sqrt(scaleFactor)) : undefined;
    const scaledCook = recipe.cook_time ? Math.round(recipe.cook_time * Math.sqrt(scaleFactor)) : undefined;
    const scaledCalories = recipe.estimated_calories 
      ? Math.round(recipe.estimated_calories * scaleFactor)
      : undefined;

    return {
      ...recipe,
      ingredients: scaledIngredients,
      prep_time: scaledPrep,
      cook_time: scaledCook,
      estimated_calories: scaledCalories
    };
  };

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
        body: { query }
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

      return response.data as RecipeData;
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
          portion_size: chosenPortions
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
              {scaledRecipe?.prep_time && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>Prep: {scaledRecipe.prep_time} mins</span>
                  {chosenPortions !== suggestedRecipe.suggested_portions && (
                    <span className="text-xs">
                      (Original: {suggestedRecipe.prep_time} mins)
                    </span>
                  )}
                </div>
              )}
              {scaledRecipe?.cook_time && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>Cook: {scaledRecipe.cook_time} mins</span>
                  {chosenPortions !== suggestedRecipe.suggested_portions && (
                    <span className="text-xs">
                      (Original: {suggestedRecipe.cook_time} mins)
                    </span>
                  )}
                </div>
              )}
              {scaledRecipe?.estimated_calories && (
                <div className="flex items-center gap-1">
                  <Flame className="h-4 w-4" />
                  <span>{scaledRecipe.estimated_calories} cal total</span>
                  {chosenPortions !== suggestedRecipe.suggested_portions && (
                    <span className="text-xs">
                      (Original: {suggestedRecipe.estimated_calories} cal)
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Portions</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    value={chosenPortions}
                    onChange={(e) => setChosenPortions(Number(e.target.value))}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">
                    {suggestedRecipe.portion_description}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  (Suggested: {suggestedRecipe.suggested_portions})
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Ingredients:</h3>
              <ul className="list-disc pl-5 space-y-1">
                {(scaledRecipe?.ingredients || []).map((ingredient, index) => (
                  <li key={index}>{ingredient}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Instructions:</h3>
              <ol className="list-decimal pl-5 space-y-1">
                {(scaledRecipe?.instructions || []).map((instruction, index) => (
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
