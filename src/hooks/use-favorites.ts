import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";

// Define the interface for favorite items
interface FavoriteItem {
  recipe_id: string;
  created_at: string;
}

export function useFavorites() {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUserId = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUserId(data.user.id);
      }
    };
    getUserId();
  }, []);

  const { data: favoritesData = [], isLoading } = useQuery<FavoriteItem[]>({
    queryKey: ['favorites', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      try {
        const { data, error } = await supabase
          .from('user_favorites')
          .select('recipe_id, created_at')
          .eq('user_id', userId);
        
        if (error) {
          // If the error is a 404 (table doesn't exist), return an empty array
          if (error.code === '404' || error.message.includes('does not exist')) {
            console.warn('user_favorites table does not exist yet. Returning empty favorites array.');
            return [];
          }
          throw error;
        }
        return data;
      } catch (error) {
        console.error('Error fetching favorites:', error);
        return [];
      }
    },
    enabled: !!userId,
    retry: false, // Don't retry if the table doesn't exist
  });

  // Extract just the recipe IDs for backward compatibility
  const favorites = favoritesData.map(fav => fav.recipe_id);

  const toggleFavorite = useMutation({
    mutationFn: async (recipeId: string) => {
      if (!userId) throw new Error("User not authenticated");
      
      const isFavorited = favorites.includes(recipeId);
      
      try {
        if (isFavorited) {
          // Remove from favorites
          const { error } = await supabase
            .from('user_favorites')
            .delete()
            .eq('user_id', userId)
            .eq('recipe_id', recipeId);
          
          if (error) {
            if (error.code === '404' || error.message.includes('does not exist')) {
              toast({
                title: "Feature not available",
                description: "The favorites feature is not fully set up yet. Please try again later.",
                variant: "destructive"
              });
              return { recipeId, favorited: isFavorited };
            }
            throw error;
          }
          return { recipeId, favorited: false };
        } else {
          // Add to favorites
          const { error } = await supabase
            .from('user_favorites')
            .insert({ user_id: userId, recipe_id: recipeId });
          
          if (error) {
            if (error.code === '404' || error.message.includes('does not exist')) {
              toast({
                title: "Feature not available",
                description: "The favorites feature is not fully set up yet. Please try again later.",
                variant: "destructive"
              });
              return { recipeId, favorited: isFavorited };
            }
            throw error;
          }
          return { recipeId, favorited: true };
        }
      } catch (error) {
        console.error('Error toggling favorite:', error);
        toast({
          title: "Error",
          description: "Failed to update favorite status. Please try again.",
          variant: "destructive"
        });
        return { recipeId, favorited: isFavorited };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', userId] });
    }
  });

  const isFavorite = (recipeId: string) => favorites.includes(recipeId);

  return {
    favorites,
    favoritesData,
    isLoading,
    toggleFavorite,
    isFavorite
  };
} 