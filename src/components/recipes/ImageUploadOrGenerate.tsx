import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ImageIcon, Upload, Loader2, Link as LinkIcon, Trash, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useImageGeneration } from "@/features/recipes/hooks/useImageGeneration";

// Constants
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const RECIPE_STORAGE_BUCKET = 'recipe-images';
const AVATAR_STORAGE_BUCKET = 'avatar-images';

interface ImageUploadOrGenerateProps {
  onImageSelected: (imageUrl: string) => void;
  title?: string;
  disabled?: boolean;
  toggleMode?: boolean;
  hasExistingImage?: boolean;
  initialImage?: string | null;
  imageType?: 'recipe' | 'avatar';
  customPrompt?: string;
  className?: string;
  imageStyle?: string;
}

export function ImageUploadOrGenerate({ 
  onImageSelected, 
  title, 
  disabled,
  toggleMode = false,
  hasExistingImage = false,
  initialImage,
  imageType = 'recipe',
  customPrompt,
  className,
  imageStyle
}: ImageUploadOrGenerateProps) {
  // State management
  const [isUploading, setIsUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialImage || null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Hooks
  const { toast } = useToast();
  const { generateImage, isLoading: isGeneratingImage } = useImageGeneration();
  const generationInProgressRef = useRef(false);

  // Get the appropriate storage bucket based on image type
  const storageBucket = imageType === 'avatar' ? AVATAR_STORAGE_BUCKET : RECIPE_STORAGE_BUCKET;

  // Effects
  useEffect(() => {
    if (initialImage) {
      setPreviewUrl(initialImage);
    }
  }, [initialImage]);

  // Helper functions
  const showToast = (config: { title: string; description: string; variant?: "default" | "destructive" }) => {
    toast(config);
  };

  const updateImagePreview = (url: string) => {
    setPreviewUrl(url);
    onImageSelected(url);
  };

  const clearImage = () => {
    setPreviewUrl(null);
    onImageSelected('');
  };

  // Image upload handlers
  const validateImageFile = (file: File): boolean => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload an image file."
      });
      return false;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      showToast({
        variant: "destructive",
        title: "File too large",
        description: "Please upload an image smaller than 2MB."
      });
      return false;
    }

    return true;
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!validateImageFile(file)) return;

    setIsUploading(true);
    try {
      const filename = `${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from(storageBucket)
        .upload(filename, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(storageBucket)
        .getPublicUrl(filename);

      updateImagePreview(publicUrl);
      
      showToast({
        title: "Success",
        description: "Image uploaded successfully"
      });
    } catch (error: unknown) {
      console.error('Upload error:', error);
      showToast({
        variant: "destructive",
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image"
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Image generation handlers
  const handleGenerateImage = async () => {
    // If a custom prompt is provided, use it directly
    if (customPrompt) {
      if (generationInProgressRef.current) {
        return; // Prevent double generation
      }

      try {
        generationInProgressRef.current = true;
        setPreviewUrl(null);
        
        const imageUrl = await generateImage(customPrompt, imageType);
        if (imageUrl) {
          updateImagePreview(imageUrl);
        }
      } finally {
        generationInProgressRef.current = false;
      }
      return;
    }

    // Otherwise, use the default prompt generation logic
    const promptText = title || (imageType === 'avatar' ? 'profile avatar' : 'food dish');
    
    if (!promptText) {
      showToast({
        title: "Error",
        description: imageType === 'avatar' 
          ? "Username or full name is required for avatar generation" 
          : "Recipe title is required for image generation",
        variant: "destructive",
      });
      return;
    }

    if (generationInProgressRef.current) {
      return; // Prevent double generation
    }

    try {
      generationInProgressRef.current = true;
      setPreviewUrl(null);
      
      // Use different prompts based on image type
      const imagePrompt = imageType === 'avatar' 
        ? `professional profile avatar: ${promptText.trim()}, stylized character portrait, friendly expression, clean background, high quality, detailed, digital art style, no text, no words, no writing, no labels, no watermarks`
        : `professional food photography: ${promptText.trim()}, appetizing presentation, elegant plating, soft natural lighting, shallow depth of field, bokeh effect, clean background, no text overlay, minimalist style, high resolution, food magazine quality, centered composition, vibrant colors, crisp details, no text, no words, no writing, no labels, no watermarks`;
      
      const imageUrl = await generateImage(imagePrompt, imageType);
      if (imageUrl) {
        updateImagePreview(imageUrl);
      }
    } finally {
      generationInProgressRef.current = false;
    }
  };

  // URL input handlers
  const validateAndSubmitUrl = async () => {
    if (!imageUrl.trim()) return;

    try {
      // Basic URL validation
      new URL(imageUrl);
      setIsImageLoading(true);

      // Create a new Image object to check if the URL loads successfully
      const img = new Image();
      
      img.onload = () => {
        updateImagePreview(imageUrl);
        setImageUrl("");
        setShowUrlInput(false);
        setIsImageLoading(false);
        showToast({
          title: "Image added",
          description: "Image URL has been added successfully."
        });
      };
      
      img.onerror = () => {
        setIsImageLoading(false);
        showToast({
          variant: "destructive",
          title: "Invalid image",
          description: "The URL provided does not point to a valid image."
        });
      };
      
      img.src = imageUrl;
    } catch (error) {
      setIsImageLoading(false);
      showToast({
        variant: "destructive",
        title: "Invalid URL",
        description: "Please enter a valid URL."
      });
    }
  };

  // Event handlers
  const handleUrlButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowUrlInput(!showUrlInput);
  };

  const handleRemoveImage = () => {
    clearImage();
    setIsEditMode(false);
  };

  // UI Components
  const renderImagePreview = () => {
    if (!previewUrl) return null;
    
    return (
      <div className={`relative ${className || 'w-full max-w-2xl mx-auto rounded-lg overflow-hidden shadow-lg'}`}>
        <img
          src={previewUrl}
          alt="Preview"
          className={imageStyle || 'w-full rounded-lg'}
          onLoad={() => setIsImageLoading(false)}
        />
        <div className="absolute top-2 right-2 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditMode(!isEditMode)}
            type="button"
            className="bg-white/80 backdrop-blur-sm hover:bg-white"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRemoveImage}
            type="button"
            className="bg-white/80 backdrop-blur-sm hover:bg-white"
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  const renderLoadingState = () => {
    if (!(isGeneratingImage || isUploading || isImageLoading)) return null;
    
    return (
      <div className="flex flex-col items-center gap-2 my-4">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm text-muted-foreground">
          {isGeneratingImage ? `Generating ${imageType === 'avatar' ? 'Avatar' : 'Recipe Image'}...` :
          isUploading ? "Uploading Image..." :
          "Loading Image..."}
        </p>
      </div>
    );
  };

  const renderImageControls = () => {
    if (!(!previewUrl || isEditMode)) return null;
    
    return (
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerateImage}
          disabled={disabled || isGeneratingImage || isUploading}
          type="button"
          className="w-full sm:w-auto"
        >
          <ImageIcon className="mr-2 h-4 w-4" />
          {previewUrl ? `Regenerate ${imageType === 'avatar' ? 'Avatar' : 'Image'}` : `Generate ${imageType === 'avatar' ? 'Avatar' : 'Image'}`}
        </Button>

        <div className="flex gap-2 w-full sm:w-auto">
          <input
            type="file"
            id="image-upload"
            className="hidden"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={disabled || isGeneratingImage}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('image-upload')?.click()}
            disabled={disabled || isGeneratingImage || isUploading}
            type="button"
            className="flex-1 sm:flex-initial"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleUrlButtonClick}
            disabled={disabled || isGeneratingImage || isUploading}
            type="button"
            className="flex-1 sm:flex-initial"
          >
            <LinkIcon className="mr-2 h-4 w-4" />
            URL
          </Button>
        </div>
      </div>
    );
  };

  const renderUrlInput = () => {
    if (!(showUrlInput && (!previewUrl || isEditMode))) return null;
    
    return (
      <div className="flex gap-2 mt-4">
        <Input
          type="url"
          placeholder="Paste image URL here..."
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              validateAndSubmitUrl();
            }
          }}
        />
        <Button 
          onClick={(e) => {
            e.preventDefault();
            validateAndSubmitUrl();
          }}
          disabled={!imageUrl.trim()}
          type="button"
        >
          Add
        </Button>
      </div>
    );
  };

  const renderToggleMode = () => {
    return (
      <div className="flex items-center p-2 border rounded-md bg-white">
        <Switch
          id="generate-image"
          checked={isGeneratingImage}
          onCheckedChange={(checked) => {
            if (checked) {
              handleGenerateImage();
            } else {
              clearImage();
            }
          }}
          disabled={disabled || isUploading || isGeneratingImage}
        />
        <label htmlFor="generate-image" className="text-sm text-gray-600 ml-2">
          Generate AI {imageType === 'avatar' ? 'avatar' : 'image'}
        </label>
      </div>
    );
  };

  // Main render
  return (
    <div className={className || 'space-y-4'}>
      {toggleMode && !previewUrl ? (
        renderToggleMode()
      ) : (
        <>
          {renderImagePreview()}
          {renderLoadingState() || (
            <>
              {(!previewUrl || isEditMode) && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-white/80 backdrop-blur-sm rounded-lg">
                  {renderImageControls()}
                  {renderUrlInput()}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
} 