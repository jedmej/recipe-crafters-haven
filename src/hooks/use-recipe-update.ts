
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import type { Database } from "@/integrations/supabase/types";

type Recipe = Database['public']['Tables']['recipes']['Row'];

export function useRecipeUpdate(recipeId: string) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Recipe>) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data: updatedRecipe, error } = await supabase
        .from('recipes')
        .update({
          title: data.title,
          description: data.description,
          ingredients: (data.ingredients as string[])?.filter(i => i.trim() !== ""),
          instructions: (data.instructions as string[])?.filter(i => i.trim() !== ""),
          prep_time: data.prep_time,
          cook_time: data.cook_time,
          estimated_calories: data.estimated_calories,
          servings: data.servings,
          source_url: data.source_url,
          language: data.language
        })
        .eq('id', recipeId)
        .select()
        .single();

      if (error) throw error;
      return updatedRecipe;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      navigate(`/recipes/${data.id}`);
      toast({
        title: "Recipe updated",
        description: "Your recipe has been successfully updated.",
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
}
