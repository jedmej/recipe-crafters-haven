import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Loader2, Link as LinkIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ImageUploadProps {
  imageUrl?: string | null;
  onImageUrlChange: (url: string) => void;
  aspectRatio?: string;
  width?: number;
  height?: number;
}

export function ImageUpload({
  imageUrl,
  onImageUrlChange,
  aspectRatio = "1:1",
  width = 800,
  height = 800,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const { toast } = useToast();

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

      onImageUrlChange(publicUrl);
      
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

  const validateAndSubmitUrl = async () => {
    if (!urlInput.trim()) return;

    try {
      // Basic URL validation
      new URL(urlInput);

      // Check if URL points to an image
      const isImage = /\.(jpg|jpeg|png|webp|avif|gif|svg)$/.test(urlInput.toLowerCase());
      if (!isImage) {
        toast({
          variant: "destructive",
          title: "Invalid image URL",
          description: "Please provide a direct link to an image file.",
        });
        return;
      }

      onImageUrlChange(urlInput);
      setUrlInput("");
      setShowUrlInput(false);
      
      toast({
        title: "Success",
        description: "Image URL added successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Invalid URL",
        description: "Please enter a valid image URL.",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <input
            type="file"
            id="image-upload"
            className="hidden"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={isUploading}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('image-upload')?.click()}
            disabled={isUploading}
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
            onClick={() => setShowUrlInput(!showUrlInput)}
          >
            <LinkIcon className="mr-2 h-4 w-4" />
            URL
          </Button>
        </div>
      </div>

      {showUrlInput && (
        <div className="flex gap-2">
          <Input
            type="url"
            placeholder="Paste image URL here..."
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                validateAndSubmitUrl();
              }
            }}
          />
          <Button 
            onClick={validateAndSubmitUrl}
            disabled={!urlInput.trim()}
          >
            Add
          </Button>
        </div>
      )}

      {imageUrl && (
        <div className="relative w-full" style={{ aspectRatio }}>
          <img
            src={imageUrl}
            alt="Uploaded image"
            className="w-full h-full object-cover rounded-lg"
            style={{ maxWidth: width, maxHeight: height }}
          />
        </div>
      )}
    </div>
  );
} 