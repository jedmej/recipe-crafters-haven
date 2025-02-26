import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import * as fal from '@fal-ai/serverless-client';

fal.config({
  credentials: import.meta.env.VITE_FAL_API_KEY,
});

const MAX_RETRIES = 3;
const BASE_DELAY = 2000; // 2 seconds

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function useImageGeneration() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const generateImage = async (prompt: string, imageType: 'recipe' | 'avatar' = 'recipe'): Promise<string | null> => {
    setIsLoading(true);
    let lastError: any = null;

    try {
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          if (attempt > 1) {
            const delay = BASE_DELAY * Math.pow(2, attempt - 1);
            console.log(`Image generation attempt ${attempt} - Waiting ${delay/1000}s before retry...`);
            await sleep(delay);
          }

          console.log(`Starting image generation attempt ${attempt} with prompt:`, prompt);
          
          const result = await fal.subscribe('fal-ai/recraft-20b', {
            input: {
              prompt: prompt,
              image_size: "square_hd",
              style: "realistic_image",
              negative_prompt: "text, watermark, label, logo, title, words, letters, numbers, signature, date, writing, typography, font, caption, inscription, handwriting, calligraphy, script, alphabet, character, symbol, glyph"
            },
            pollInterval: 1000,
            logs: true,
            onQueueUpdate: (update) => {
              if (update.status === "IN_PROGRESS") {
                const latestMessage = update.logs[update.logs.length - 1]?.message;
                if (latestMessage) {
                  console.log('Image generation progress:', latestMessage);
                  toast({
                    title: `Generating ${imageType === 'avatar' ? 'Avatar' : 'Image'}`,
                    description: latestMessage,
                    duration: 2000,
                  });
                }
              }
            }
          });

          console.log('Image generation result:', result);

          // Check if result exists and has the expected structure
          if (!result) {
            throw new Error('No response from image generation service');
          }

          // Access the image URL from the correct path in the response
          const imageUrl = result?.images?.[0]?.url;
          if (!imageUrl) {
            throw new Error('No image URL in response');
          }

          return imageUrl;
        } catch (error) {
          console.error(`Image generation attempt ${attempt} failed:`, error);
          lastError = error;
          
          if (attempt === MAX_RETRIES) {
            toast({
              title: `${imageType === 'avatar' ? 'Avatar' : 'Image'} Generation Failed`,
              description: error.message || 'Failed to generate image. Please try again.',
              variant: 'destructive',
            });
            return null;
          }
        }
      }

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