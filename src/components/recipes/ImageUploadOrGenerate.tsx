import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ImageIcon, Upload, Loader2, Link as LinkIcon, Trash, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/utils/cn";
import { useImageGeneration } from "@/features/recipes/hooks/useImageGeneration";

interface ImageUploadOrGenerateProps {
  onImageSelected: (imageUrl: string) => void;
  title?: string;
  disabled?: boolean;
  toggleMode?: boolean;
  hasExistingImage?: boolean;
  initialImage?: string;
}

export function ImageUploadOrGenerate({ 
  onImageSelected, 
  title, 
  disabled,
  toggleMode = false,
  hasExistingImage = false,
  initialImage
}: ImageUploadOrGenerateProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialImage || null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const { toast } = useToast();
  const { generateImage, isLoading: isGeneratingImage } = useImageGeneration();
  const generationInProgressRef = useRef(false);

  useEffect(() => {
    if (initialImage) {
      setPreviewUrl(initialImage);
    }
  }, [initialImage]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload an image file.",
      });
      return;
    }

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please upload an image smaller than 2MB.",
      });
      return;
    }

    setIsUploading(true);
    try {
      const filename = `${Date.now()}-${file.name}`;
      const { error: uploadError, data } = await supabase.storage
        .from('recipe-images')
        .upload(filename, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('recipe-images')
        .getPublicUrl(filename);

      setPreviewUrl(publicUrl);
      onImageSelected(publicUrl);
      
      toast({
        title: "Success",
        description: "Image uploaded successfully"
      });
    } catch (error: unknown) {
      console.error('Upload error:', error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!title) {
      toast({
        title: "Error",
        description: "Recipe title is required for image generation",
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
      
      const imageUrl = await generateImage(title);
      if (imageUrl) {
        setPreviewUrl(imageUrl);
        onImageSelected(imageUrl);
      }
    } finally {
      generationInProgressRef.current = false;
    }
  };

  const validateAndSubmitUrl = async () => {
    if (!imageUrl.trim()) return;

    try {
      // Basic URL validation
      new URL(imageUrl);

      setIsImageLoading(true);

      // Create a new Image object to check if the URL loads successfully
      const img = new Image();
      img.onload = () => {
        setPreviewUrl(imageUrl);
        onImageSelected(imageUrl);
        setImageUrl("");
        setShowUrlInput(false);
        setIsImageLoading(false);
        toast({
          title: "Image added",
          description: "Image URL has been added successfully.",
        });
      };
      img.onerror = () => {
        setIsImageLoading(false);
        toast({
          variant: "destructive",
          title: "Invalid image",
          description: "The URL provided does not point to a valid image.",
        });
      };
      img.src = imageUrl;
    } catch (error) {
      setIsImageLoading(false);
      toast({
        variant: "destructive",
        title: "Invalid URL",
        description: "Please enter a valid URL.",
      });
    }
  };

  const handleUrlButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowUrlInput(!showUrlInput);
  };

  const handleGenerateClick = () => {
    handleGenerateImage();
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    onImageSelected('');
    setIsEditMode(false);
  };

  return (
    <div className="space-y-4">
      {toggleMode && !previewUrl ? (
        <div className="flex items-center p-2 border rounded-md bg-white">
          <Switch
            id="generate-image"
            checked={isGeneratingImage}
            onCheckedChange={(checked) => {
              if (checked) {
                handleGenerateImage();
              } else {
                setPreviewUrl(null);
                onImageSelected('');
              }
            }}
            disabled={disabled || isUploading || isGeneratingImage}
          />
          <label htmlFor="generate-image" className="text-sm text-gray-600 ml-2">
            Generate AI image
          </label>
        </div>
      ) : (
        <>
          {previewUrl && (
            <div className="relative w-full max-w-2xl mx-auto rounded-lg overflow-hidden shadow-lg">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full rounded-lg"
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
          )}

          {(isGeneratingImage || isUploading || isImageLoading) ? (
            <div className="flex flex-col items-center gap-2 my-4">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-sm text-muted-foreground">
                {isGeneratingImage ? "Generating Recipe Image..." :
                isUploading ? "Uploading Image..." :
                "Loading Image..."}
              </p>
            </div>
          ) : (
            <>
              {(!previewUrl || isEditMode) && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateClick}
                    disabled={disabled || isGeneratingImage || isUploading}
                    type="button"
                    className="w-full sm:w-auto"
                  >
                    <ImageIcon className="mr-2 h-4 w-4" />
                    {previewUrl ? 'Regenerate Image' : 'Generate Image'}
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
              )}

              {showUrlInput && (!previewUrl || isEditMode) && (
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
              )}
            </>
          )}
        </>
      )}
    </div>
  );
} 