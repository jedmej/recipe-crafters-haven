import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { RecipeData } from "@/types/recipe";

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [recipe, setRecipe] = useState<RecipeData | null>(null);

  // Fetch recipe data
  const { data, error } = useQuery({
    queryKey: ['recipes', id],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', id)
        .eq('user_id', session.user.id)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setRecipe(data);
      setIsLoading(false);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error fetching recipe",
        description: "Could not load the recipe. Please try again.",
      });
      navigate("/recipes");
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button
          as={Link}
          to={`/recipes/${id}/edit`}
          className="gap-2"
        >
          <PencilIcon className="h-4 w-4" />
          Edit Recipe
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{recipe.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{recipe.description}</p>
          <h3>Ingredients</h3>
          <ul>
            {recipe.ingredients.map((ingredient, index) => (
              <li key={index}>{ingredient}</li>
            ))}
          </ul>
          <h3>Instructions</h3>
          <ol>
            {recipe.instructions.map((instruction, index) => (
              <li key={index}>{instruction}</li>
            ))}
          </ol>
          <p>Prep Time: {recipe.prep_time} minutes</p>
          <p>Cook Time: {recipe.cook_time} minutes</p>
          <p>Estimated Calories: {recipe.estimated_calories}</p>
          <p>Suggested Portions: {recipe.suggested_portions}</p>
          <p>Language: {recipe.language}</p>
        </CardContent>
      </Card>
    </div>
  );
}
