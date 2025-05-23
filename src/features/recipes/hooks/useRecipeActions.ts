
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { categorizeIngredient } from '@/features/groceries/utils/categorization';
import { useImageGeneration } from './useImageGeneration';
import { RecipeData } from '@/types/recipe';
import { scaleAndConvertIngredient } from '../utils/ingredient-parsing';

interface UseRecipeActionsProps {
  recipeId?: string;
  scaleFactor?: number;
  measurementSystem?: 'metric' | 'imperial';
}

export function useRecipeActions(
  recipe?: RecipeData | null, 
  scaleFactor = 1,
  measurementSystem: 'metric' | 'imperial' = 'metric'
) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { generateImage } = useImageGeneration();
  
  // Delete recipe mutation
  const deleteRecipe = useMutation({
    mutationFn: async () => {
      if (!recipe?.id) throw new Error('Recipe ID is required');
      
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
        title: "Recipe Deleted",
        description: "The recipe has been successfully deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: error.message,
      });
    },
  });

  // Add ingredients to grocery list mutation
  const addToGroceryList = useMutation({
    mutationFn: async () => {
      if (!recipe) throw new Error('Recipe is required');

      // Process the recipe ingredients to ensure they are properly scaled
      const processedIngredients = recipe.ingredients.map(ingredient => {
        const scaledIngredient = scaleAndConvertIngredient(ingredient, scaleFactor, measurementSystem);
        return {
          name: scaledIngredient,
          checked: false,
          category: categorizeIngredient(ingredient)
        };
      });

      // Resolve all category promises
      const groceryItems = await Promise.all(
        processedIngredients.map(async (item) => ({
          name: item.name,
          checked: item.checked,
          category: typeof item.category === 'string' ? item.category : await item.category
        }))
      );

      // Get the current user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('You must be logged in to add to grocery list');

      // Create a new grocery list with the recipe's ingredients
      const { data, error } = await supabase
        .from('grocery_lists')
        .insert({
          title: `Ingredients for ${recipe.title}`,
          user_id: session.user.id,
          recipe_id: recipe.id,
          image_url: recipe.image_url || recipe.imageUrl,
          items: groceryItems
        })
        .select('id')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Added to Grocery List",
        description: "Ingredients have been added to your grocery list.",
      });
      navigate(`/grocery-lists/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to Add to Grocery List",
        description: error.message,
      });
    },
  });

  // Favorite recipe mutation (toggle)
  const toggleFavorite = useMutation({
    mutationFn: async () => {
      if (!recipe?.id) throw new Error('Recipe ID is required');
      
      // Get the current user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('You must be logged in to favorite recipes');
      
      // Check if already favorited
      const { data: existingFavorite, error: checkError } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('recipe_id', recipe.id)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        // Error other than "no rows returned"
        throw checkError;
      }
      
      if (existingFavorite) {
        // Remove from favorites
        const { error: deleteError } = await supabase
          .from('user_favorites')
          .delete()
          .eq('id', existingFavorite.id);
          
        if (deleteError) throw deleteError;
        return { added: false };
      } else {
        // Add to favorites
        const { error: insertError } = await supabase
          .from('user_favorites')
          .insert({
            user_id: session.user.id,
            recipe_id: recipe.id
          });
          
        if (insertError) throw insertError;
        return { added: true };
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-favorites'] });
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      
      toast({
        title: data.added ? "Added to Favorites" : "Removed from Favorites",
        description: data.added ? 
          "This recipe has been added to your favorites." : 
          "This recipe has been removed from your favorites.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to Update Favorites",
        description: error.message,
      });
    },
  });

  // Update recipe image
  const updateRecipeImage = useMutation({
    mutationFn: async (imageUrl: string) => {
      if (!recipe?.id) throw new Error('Recipe ID is required');
      
      const { error } = await supabase
        .from('recipes')
        .update({ image_url: imageUrl })
        .eq('id', recipe.id);
      
      if (error) throw error;
      return imageUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes', recipe?.id] });
      toast({
        title: "Image Updated",
        description: "Recipe image has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to Update Image",
        description: error.message,
      });
    },
  });

  // Generate recipe image
  const generateRecipeImage = async () => {
    if (!recipe) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No recipe data available.",
      });
      return;
    }

    try {
      const prompt = `Professional food photography of ${recipe.title}. ${recipe.description || ''}`;
      const imageUrl = await generateImage(prompt);
      
      // Update the recipe with the new image
      await updateRecipeImage.mutateAsync(imageUrl);
    } catch (error) {
      console.error('Error generating recipe image:', error);
      toast({
        variant: "destructive",
        title: "Image Generation Failed",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  // Handle delete with confirmation
  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this recipe? This action cannot be undone.')) {
      deleteRecipe.mutate();
    }
  };

  return {
    isDeleting: deleteRecipe.isPending,
    isAddingToGroceryList: addToGroceryList.isPending,
    isFavoriting: toggleFavorite.isPending,
    isUpdatingImage: updateRecipeImage.isPending,
    handleDelete,
    addToGroceryList,
    toggleFavorite,
    updateRecipeImage,
    generateRecipeImage
  };
}
