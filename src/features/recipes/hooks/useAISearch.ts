import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RecipeData } from '@/types/recipe';
import { scaleRecipe } from '@/utils/recipe-scaling';

interface AIRecipeResponse {
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  suggested_portions: number;
  source_url?: string;
  cook_time?: number;
  prep_time?: number;
  estimated_calories?: number;
  portion_description?: string;
}

export function useAISearch() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSearching, setIsSearching] = useState(false);
  const [suggestedRecipe, setSuggestedRecipe] = useState<RecipeData | null>(null);
  const [chosenPortions, setChosenPortions] = useState<number>(0);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const recipeToGenerateImage = useRef<string | null>(null);

  const searchRecipe = useMutation({
    mutationFn: async ({ query, language }: { query: string; language: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("User not authenticated");
      }

      const API_URL = 'https://yorijihyeahhfprgjkvp.supabase.co/functions/v1/ai-recipe-search';
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ query, language }),
      });

      const responseData = await response.json();
      console.log('API Response:', {
        status: response.status,
        ok: response.ok,
        data: responseData
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${JSON.stringify(responseData)}`);
      }

      if (!responseData.success || !responseData.data) {
        console.error('API returned unsuccessful response:', responseData);
        throw new Error(responseData.error || 'Failed to get recipe data');
      }

      const apiResponse = responseData.data;
      const recipe: RecipeData = {
        title: apiResponse.title,
        description: apiResponse.description,
        ingredients: apiResponse.ingredients,
        instructions: apiResponse.instructions,
        suggested_portions: apiResponse.suggested_portions,
        source_url: apiResponse.source_url ?? null,
        cook_time: apiResponse.cook_time ?? null,
        prep_time: apiResponse.prep_time ?? null,
        estimated_calories: apiResponse.estimated_calories ?? null,
        portion_description: apiResponse.portion_description ?? `Serves ${apiResponse.suggested_portions}`,
      };

      return recipe;
    },
    onSuccess: (data) => {
      setSuggestedRecipe(data);
      setChosenPortions(data.suggested_portions);
      toast({
        title: "Recipe found",
        description: "Here's the recipe suggestion based on your search.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Search failed",
        description: error.message,
      });
    },
  });

  const saveRecipe = useMutation({
    mutationFn: async () => {
      if (!suggestedRecipe) throw new Error("No recipe to save");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const scaledRecipe = scaleRecipe(
        suggestedRecipe,
        chosenPortions,
        suggestedRecipe.suggested_portions
      );

      const recipeToSave = {
        title: scaledRecipe.title,
        description: scaledRecipe.description,
        ingredients: scaledRecipe.ingredients,
        instructions: scaledRecipe.instructions,
        cook_time: scaledRecipe.cook_time,
        prep_time: scaledRecipe.prep_time,
        estimated_calories: scaledRecipe.estimated_calories,
        suggested_portions: scaledRecipe.suggested_portions,
        portion_size: chosenPortions,
        source_url: scaledRecipe.source_url,
        image_url: scaledRecipe.imageUrl,
        user_id: user.id
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
        title: "Recipe saved",
        description: "The recipe has been added to your collection.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Save failed",
        description: error.message || "Failed to save the recipe. Please try again.",
      });
    }
  });

  const handleImageGenerated = (imageUrl: string) => {
    setIsGeneratingImage(false);
    if (suggestedRecipe) {
      setSuggestedRecipe({
        ...suggestedRecipe,
        imageUrl: imageUrl
      });
    }
  };

  return {
    isSearching,
    suggestedRecipe,
    chosenPortions,
    isGeneratingImage,
    recipeToGenerateImage,
    searchRecipe,
    saveRecipe,
    setIsSearching,
    setSuggestedRecipe,
    setChosenPortions,
    setIsGeneratingImage,
    handleImageGenerated
  };
} 