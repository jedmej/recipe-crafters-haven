import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';
import { MeasurementSystem } from '@/lib/types';
import { scaleAndConvertIngredient } from '../utils/ingredient-parsing';
import { categorizeItem } from '@/features/groceries/utils/categorization';

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

      // First, categorize all ingredients using local categorization for immediate display
      const localCategorizedIngredients = scaledIngredients.map(item => ({ 
        name: item, 
        checked: false,
        category: categorizeItem(item)
      }));

      // Create the grocery list with local categorization first
      const { data, error } = await supabase
        .from('grocery_lists')
        .insert({
          title: listTitle,
          items: localCategorizedIngredients,
          user_id: user.id,
          recipe_id: recipe.id
        })
        .select('*')
        .single();
      
      if (error) throw error;

      // Then, in the background, update with AI categorization
      setTimeout(async () => {
        try {
          // Get AI categories for all ingredients
          const aiCategorizedIngredients = await Promise.all(
            scaledIngredients.map(async (item) => {
              try {
                const category = await categorizeItem(item);
                return { 
                  name: item, 
                  checked: false,
                  category 
                };
              } catch (error) {
                console.error(`Error getting AI category for ${item}:`, error);
                return { 
                  name: item, 
                  checked: false,
                  category: categorizeItem(item) 
                };
              }
            })
          );

          // Check if there are any category changes
          const hasChanges = aiCategorizedIngredients.some((aiItem, index) => 
            aiItem.category !== localCategorizedIngredients[index].category
          );

          if (hasChanges) {
            // Update the database with AI categories
            await supabase
              .from('grocery_lists')
              .update({ items: aiCategorizedIngredients })
              .eq('id', data.id);
            
            // Update the cache
            queryClient.invalidateQueries({ queryKey: ['groceryLists', data.id] });
            queryClient.invalidateQueries({ queryKey: ['allGroceryLists'] });
          }
        } catch (error) {
          console.error('Error updating grocery list with AI categories:', error);
        }
      }, 100);

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['allGroceryLists'] });
      toast({
        title: "Added to grocery list",
        description: "Recipe ingredients have been added to your grocery list.",
      });
    },
    onError: (error: Error) => {
      console.error('Error creating grocery list:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add to grocery list. Please try again.",
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