import { memo, useMemo, useRef } from "react";
import { RecipeImageProps } from "./types";
import ImageControls from "./ImageControls";
import { useImageGeneration } from "@/features/recipes/hooks/useImageGeneration";
import { useToast } from "@/hooks/use-toast";
import { AsyncHandler, createAsyncHandler } from "./utils";
import { Heart, PencilSimple, SpinnerGap, Trash } from "@phosphor-icons/react";
import { useFavorites } from "@/hooks/use-favorites";
import { RoundButton } from "@/components/ui/round-button";

const RecipeImage = memo(
  ({ 
    imageUrl, 
    title,
    recipe,
    onImageUpdate,
    isGeneratingImage,
    onEditOrGenerate,
    onSave,
    isSaving
  }: RecipeImageProps) => {
    const hasImage = !!imageUrl;
    const { generateImage, isLoading: isGeneratingFromButton } = useImageGeneration();
    const { toast } = useToast();
    const imageRef = useRef<HTMLDivElement>(null);
    const { isFavorite, toggleFavorite } = useFavorites();
    const isFavorited = recipe?.id ? isFavorite(recipe.id) : false;

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

    // Handle favorite toggle
    const handleFavoriteClick = async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!recipe?.id) return;
      await toggleFavorite.mutateAsync(recipe.id);
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

            {/* Action buttons positioned in bottom right */}
            <div className="absolute bottom-8 right-8 flex gap-2 z-20">
              <RoundButton
                onClick={handleFavoriteClick}
                icon={<Heart weight={isFavorited ? "duotone" : "regular"} size={20} />}
                label={isFavorited ? "Remove from favorites" : "Add to favorites"}
                disabled={!recipe?.id}
                active={isFavorited}
                className="bg-white/90 backdrop-blur-sm hover:bg-white"
              />
              <RoundButton
                onClick={onEditOrGenerate}
                icon={<PencilSimple weight="duotone" size={20} />}
                label={recipe?.id ? "Edit Recipe" : "Generate New"}
                className="bg-white/90 backdrop-blur-sm hover:bg-white"
              />
              {recipe?.id && (
                <RoundButton
                  onClick={onSave}
                  icon={isSaving ? (
                    <SpinnerGap size={20} className="animate-spin" />
                  ) : (
                    <Trash weight="duotone" size={20} />
                  )}
                  label="Delete Recipe"
                  disabled={isSaving}
                  className="bg-white/90 backdrop-blur-sm hover:bg-white"
                />
              )}
            </div>
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