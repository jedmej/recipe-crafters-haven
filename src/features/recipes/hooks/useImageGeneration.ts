
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useImageGeneration() {
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  
  // Generate image mutation
  const generateImageMutation = useMutation({
    mutationFn: async ({ 
      prompt, 
      size = '1024x1024', 
      quality = "standard" 
    }: { 
      prompt: string; 
      size?: string; 
      quality?: string; 
    }) => {
      try {
        setIsGenerating(true);
        
        const { data, error } = await supabase.functions.invoke('generate-image', {
          body: { 
            prompt,
            size,
            quality,
          }
        });
        
        if (error) throw new Error(error.message);
        
        if (!data || !data.imageUrl) {
          throw new Error('Failed to generate image: No URL returned');
        }
        
        return data.imageUrl;
      } catch (error) {
        console.error('Error generating image:', error);
        throw error;
      } finally {
        setIsGenerating(false);
      }
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Image Generation Failed",
        description: error.message,
      });
    },
  });

  // Upload image to storage
  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      try {
        setIsLoading(true);
        
        // First upload to storage
        const fileExt = file.name.split('.').pop();
        const filePath = `recipe-images/${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('recipe-images')
          .upload(filePath, file);
          
        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data: urlData } = await supabase.storage
          .from('recipe-images')
          .getPublicUrl(uploadData.path);
          
        if (!urlData) {
          throw new Error('Failed to get public URL for uploaded image');
        }
        
        return urlData.publicUrl;
      } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
      } finally {
        setIsLoading(true);
      }
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Image Upload Failed",
        description: error.message,
      });
    },
  });

  // Callable function to generate an image
  const generateImage = async (
    prompt: string, 
    type: 'recipe' | 'profile' = 'recipe'
  ): Promise<string> => {
    try {
      // Enhance prompt based on type
      let enhancedPrompt = prompt;
      if (type === 'recipe') {
        enhancedPrompt = `Professional food photography: ${prompt}, appetizing presentation, soft natural lighting`;
      }
      
      const imageUrl = await generateImageMutation.mutateAsync({ prompt: enhancedPrompt });
      return imageUrl;
      
    } catch (error) {
      console.error('Error in generateImage:', error);
      toast({
        variant: "destructive",
        title: "Image Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate image",
      });
      throw error;
    }
  };

  return {
    generateImage,
    uploadImage: uploadImageMutation.mutate,
    isGenerating: isGenerating || generateImageMutation.isPending,
    isUploading: isLoading || uploadImageMutation.isPending,
  };
}
