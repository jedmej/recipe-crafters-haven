import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useImageGeneration } from './useImageGeneration';
import { RecipeData } from '@/types/recipe';

interface UseRecipeGenerationOptions {
  onSuccess?: (recipeId: string) => void;
  onError?: (error: Error) => void;
  shouldGenerateImage?: boolean;
}

export function useRecipeGeneration(options: UseRecipeGenerationOptions = {}) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { generateImage } = useImageGeneration();

  // Recipe generation mutation
  const mutation = useMutation({
    mutationFn: async (recipe: RecipeData) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("User not authenticated");

      let imageUrl = recipe.image_url;

      // Generate image if enabled
      if (options.shouldGenerateImage) {
        try {
          const imagePrompt = `professional food photography: ${recipe.title.trim()}, appetizing presentation, elegant plating, soft natural lighting, shallow depth of field, bokeh effect, clean background, no text overlay, minimalist style, high resolution, food magazine quality, centered composition, vibrant colors, crisp details, no text, no words, no writing, no labels, no watermarks`;
          imageUrl = await generateImage(imagePrompt, 'recipe');
        } catch (error) {
          console.error('Error generating image:', error);
        }
      }

      // Save recipe to database
      const recipeToSave = {
        ...recipe,
        user_id: session.user.id,
        image_url: imageUrl,
      };

      const { data, error } = await supabase
        .from('recipes')
        .insert([recipeToSave])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      navigate(`/recipes/${data.id}`);
      toast({
        title: "Recipe Created",
        description: "Your recipe has been generated and saved.",
      });
      options.onSuccess?.(data.id);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: error.message || "Failed to generate and save the recipe. Please try again.",
      });
      options.onError?.(error);
    }
  });

  return {
    generateAndSaveRecipe: mutation.mutateAsync,
    isGenerating: mutation.isPending,
    isGeneratingImage: mutation.isPending && options.shouldGenerateImage,
    recipeImage: null
  };
} 