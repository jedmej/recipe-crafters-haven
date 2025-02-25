import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useRecipeSelection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRecipes, setSelectedRecipes] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const deleteRecipes = useMutation({
    mutationFn: async (recipeIds: string[]) => {
      const { error } = await supabase
        .from('recipes')
        .delete()
        .in('id', recipeIds);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      setSelectedRecipes([]);
      setIsSelectionMode(false);
      toast({
        title: "Recipes deleted",
        description: "Selected recipes have been deleted successfully.",
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

  const toggleRecipeSelection = (recipeId: string) => {
    setSelectedRecipes(prev => {
      const newSelection = prev.includes(recipeId)
        ? prev.filter(id => id !== recipeId)
        : [...prev, recipeId];
      
      if (newSelection.length === 0) {
        setIsSelectionMode(false);
      }
      
      return newSelection;
    });
  };

  const handleDeleteSelected = () => {
    deleteRecipes.mutate(selectedRecipes);
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      setSelectedRecipes([]);
    }
  };

  return {
    selectedRecipes,
    isSelectionMode,
    toggleRecipeSelection,
    handleDeleteSelected,
    toggleSelectionMode
  };
} 