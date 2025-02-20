import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import * as fal from '@fal-ai/serverless-client';

fal.config({
  credentials: import.meta.env.VITE_FAL_API_KEY,
});

export function useImageGeneration() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const generateImage = async (prompt: string): Promise<string | null> => {
    setIsLoading(true);
    try {
      const result = await fal.subscribe('fal-ai/fast-sdxl', {
        input: {
          prompt,
          negative_prompt: 'cartoon, illustration, drawing, painting, anime, manga, low quality, blurry',
          num_inference_steps: 50,
          guidance_scale: 7.5,
        },
      });

      if (result?.images?.[0]?.url) {
        return result.images[0].url;
      }
      return null;
    } catch (error) {
      console.error('Image generation error:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate image',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    generateImage,
    isLoading,
  };
} 