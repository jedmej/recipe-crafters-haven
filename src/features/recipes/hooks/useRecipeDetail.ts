import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { MeasurementSystem } from '@/lib/types';

type Recipe = Database['public']['Tables']['recipes']['Row'];

export function useRecipeDetail(id: string | undefined) {
  const [desiredServings, setDesiredServings] = useState<number | ''>(1);
  const [measurementSystem, setMeasurementSystem] = useState<MeasurementSystem>('metric');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [showImageGenerator, setShowImageGenerator] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const { data: recipe, isLoading, error } = useQuery({
    queryKey: ['recipes', id],
    queryFn: async () => {
      if (!id) throw new Error('Recipe ID is required');
      
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) throw new Error('Recipe not found');
      
      setDesiredServings(data.suggested_portions);
      
      return data as Recipe;
    },
    enabled: !!id
  });

  const handleServingsChange = (value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue > 0) {
      setDesiredServings(numValue);
    } else if (value === '') {
      setDesiredServings('');
    }
  };

  const toggleMeasurementSystem = () => {
    setMeasurementSystem(prev => prev === 'imperial' ? 'metric' : 'imperial');
  };

  const scaleFactor = typeof desiredServings === 'number' && recipe 
    ? desiredServings / recipe.servings 
    : 1;

  const calculateCaloriesPerServing = (totalCalories: number | null, servings: number): number | null => {
    if (totalCalories === null) return null;
    return Math.round(totalCalories / servings);
  };

  return {
    recipe,
    isLoading,
    error,
    desiredServings,
    measurementSystem,
    isGeneratingImage,
    showImageGenerator,
    isRegenerating,
    scaleFactor,
    handleServingsChange,
    toggleMeasurementSystem,
    calculateCaloriesPerServing,
    setIsGeneratingImage,
    setShowImageGenerator,
    setIsRegenerating
  };
} 