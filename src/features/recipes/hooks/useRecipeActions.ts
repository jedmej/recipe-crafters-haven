import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';
import { MeasurementSystem } from '@/lib/types';
import { scaleAndConvertIngredient } from '../utils/ingredient-parsing';

type Recipe = Database['public']['Tables']['recipes']['Row'];

export function useRecipeActions(recipe: Recipe | undefined, scaleFactor: number, measurementSystem: MeasurementSystem) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteRecipe = useMutation({
    mutationFn: async () => {
      if (!recipe) throw new Error('Recipe not found');
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', recipe.id);
      
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

  const addToGroceryList = useMutation({
    mutationFn: async () => {
      if (!recipe) throw new Error("Recipe not found");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const listTitle = `${recipe.title} - ${new Date().toLocaleDateString()}`;
      const scaledIngredients = (recipe.ingredients as string[]).map(ingredient => 
        scaleAndConvertIngredient(ingredient, scaleFactor, measurementSystem)
      );

      const { data, error } = await supabase
        .from('grocery_lists')
        .insert({
          title: listTitle,
          items: scaledIngredients.map(item => ({ name: item, checked: false })),
          user_id: user.id,
          recipe_id: recipe.id
        })
        .select('*')
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      navigate(`/grocery-lists/${data.id}`);
      toast({
        title: "Grocery list created",
        description: "Recipe ingredients have been added to a new grocery list.",
      });
    },
    onError: (error: Error) => {
      console.error('Error creating grocery list:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create grocery list. Please try again.",
      });
    }
  });

  const updateRecipeImage = useMutation({
    mutationFn: async (imageUrl: string) => {
      if (!recipe) throw new Error('Recipe not found');
      const { error } = await supabase
        .from('recipes')
        .update({ image_url: imageUrl })
        .eq('id', recipe.id);

      if (error) throw error;
      return imageUrl;
    },
    onMutate: async (newImageUrl) => {
      await queryClient.cancelQueries({ queryKey: ['recipes', recipe?.id] });
      const previousRecipe = queryClient.getQueryData(['recipes', recipe?.id]);
      queryClient.setQueryData(['recipes', recipe?.id], (old: Recipe | undefined) => {
        if (!old) return old;
        return { ...old, image_url: newImageUrl };
      });
      return { previousRecipe };
    },
    onError: (err, newImageUrl, context) => {
      queryClient.setQueryData(['recipes', recipe?.id], context?.previousRecipe);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update recipe image. Please try again.",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes', recipe?.id] });
    }
  });

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this recipe?')) {
      setIsDeleting(true);
      await deleteRecipe.mutateAsync();
      setIsDeleting(false);
    }
  };

  return {
    isDeleting,
    handleDelete,
    addToGroceryList,
    updateRecipeImage
  };
} 