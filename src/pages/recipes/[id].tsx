
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, ArrowLeft, Trash, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

type Recipe = Database['public']['Tables']['recipes']['Row'];

export default function RecipeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: recipe, isLoading } = useQuery({
    queryKey: ['recipes', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Recipe;
    }
  });

  const deleteRecipe = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      navigate('/recipes');
      toast({
        title: "Recipe deleted",
        description: "Your recipe has been successfully deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  });

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this recipe?')) {
      setIsDeleting(true);
      await deleteRecipe.mutateAsync();
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold">Recipe not found</h1>
      </div>
    );
  }

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

      <Card>
        {recipe.image_url && (
          <div className="relative h-64 w-full">
            <img
              src={recipe.image_url}
              alt={recipe.title}
              className="absolute inset-0 w-full h-full object-cover rounded-t-lg"
            />
          </div>
        )}
        
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-3xl">{recipe.title}</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(`/recipes/${id}/edit`)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              size="icon"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {recipe.description && (
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground">{recipe.description}</p>
            </div>
          )}

          <div>
            <h3 className="font-semibold mb-2">Ingredients</h3>
            <ul className="list-disc pl-5 space-y-1">
              {(recipe.ingredients as string[]).map((ingredient, index) => (
                <li key={index}>{ingredient}</li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Instructions</h3>
            <ol className="list-decimal pl-5 space-y-2">
              {(recipe.instructions as string[]).map((instruction, index) => (
                <li key={index}>{instruction}</li>
              ))}
            </ol>
          </div>

          {recipe.source_url && (
            <div>
              <h3 className="font-semibold mb-2">Source</h3>
              <a
                href={recipe.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Original Recipe
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
