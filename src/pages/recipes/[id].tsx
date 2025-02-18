
import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, Pencil } from "lucide-react";
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
      setRecipe(data);
      setIsLoading(false);
      return data;
    }
  });

  if (error) {
    toast({
      variant: "destructive",
      title: "Error fetching recipe",
      description: "Could not load the recipe. Please try again.",
    });
    navigate("/recipes");
    return null;
  }

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
        <Link to={`/recipes/${id}/edit`}>
          <Button className="gap-2">
            <Pencil className="h-4 w-4" />
            Edit Recipe
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{recipe?.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {recipe?.description && <p>{recipe.description}</p>}
          <h3>Ingredients</h3>
          <ul>
            {recipe?.ingredients.map((ingredient, index) => (
              <li key={index}>{ingredient}</li>
            ))}
          </ul>
          <h3>Instructions</h3>
          <ol>
            {recipe?.instructions.map((instruction, index) => (
              <li key={index}>{instruction}</li>
            ))}
          </ol>
          {recipe?.prep_time && <p>Prep Time: {recipe.prep_time} minutes</p>}
          {recipe?.cook_time && <p>Cook Time: {recipe.cook_time} minutes</p>}
          {recipe?.estimated_calories && <p>Estimated Calories: {recipe.estimated_calories}</p>}
          {recipe?.suggested_portions && <p>Suggested Portions: {recipe.suggested_portions}</p>}
          <p>Language: {recipe?.language}</p>
        </CardContent>
      </Card>
    </div>
  );
}
