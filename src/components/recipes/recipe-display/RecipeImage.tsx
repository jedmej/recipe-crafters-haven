import { memo, useMemo, useRef } from "react";
import { RecipeImageProps } from "./types";
import ImageControls from "./ImageControls";
import { useImageGeneration } from "@/features/recipes/hooks/useImageGeneration";
import { useToast } from "@/hooks/use-toast";
import { AsyncHandler, createAsyncHandler } from "./utils";

const RecipeImage = memo(
  ({ 
    imageUrl, 
    title, 
    onImageUpdate,
    isGeneratingImage 
  }: RecipeImageProps) => {
    const hasImage = !!imageUrl;
    const { generateImage, isLoading: isGeneratingFromButton } = useImageGeneration();
    const { toast } = useToast();
    const imageRef = useRef<HTMLDivElement>(null);

    // Combine both loading states
    const isGenerating = isGeneratingFromButton || isGeneratingImage;

    // Generate image prompt based on recipe title
    const generateImagePrompt = (title: string): string => {
      return `professional food photography: ${title.trim()}, appetizing presentation, elegant plating, soft natural lighting, shallow depth of field, bokeh effect, clean background, no text overlay, minimalist style, high resolution, food magazine quality, centered composition, vibrant colors, crisp details, no text, no words, no writing, no labels, no watermarks`;
    };

    // Core image generation function
    const handleGenerateImage = async () => {
      if (!onImageUpdate) return;
      
      const imagePrompt = generateImagePrompt(title);
      const generatedImageUrl = await generateImage(imagePrompt, 'recipe');
      
      if (generatedImageUrl) {
        await onImageUpdate(generatedImageUrl);
      }
    };

    // File upload handler
    const handleFileUpload = async (file: File) => {
      if (!onImageUpdate) return;
      
      return new Promise<void>((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async (e) => {
          try {
            const imageUrl = e.target?.result as string;
            if (imageUrl) {
              await onImageUpdate(imageUrl);
              resolve();
            } else {
              reject(new Error("Failed to read image file"));
            }
          } catch (error) {
            reject(error);
          }
        };
        
        reader.onerror = () => reject(new Error("Failed to read image file"));
        reader.readAsDataURL(file);
      });
    };

    // URL upload handler
    const handleUrlUpload = async (url: string) => {
      if (!onImageUpdate) return;
      await onImageUpdate(url);
    };

    return (
      <div className="relative w-full h-[60vh]">
        {hasImage ? (
          <div className="w-full h-full relative overflow-hidden" ref={imageRef}>
            <img 
              src={imageUrl} 
              alt={title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {/* Dark gradient overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/10 to-black/30"></div>
            
            {/* Static white overlay with fixed opacity */}
            <div className="absolute inset-0 bg-white pointer-events-none opacity-0"></div>
            
            {/* Strong fade effect at the bottom of the image */}
            <div className="absolute bottom-0 left-0 right-0 h-[16rem] bg-gradient-to-t from-[#fff] via-[#fff]/80 to-transparent z-10"></div>
          </div>
        ) : (
          <div className="w-full h-full bg-[#E4E7DF] flex flex-col justify-center items-center">
            <ImageControls
              onFileUpload={handleFileUpload}
              onUrlUpload={handleUrlUpload}
              onGenerate={handleGenerateImage}
              isGenerating={isGenerating}
            />
          </div>
        )}
      </div>
    );
  }
);

export default RecipeImage; 