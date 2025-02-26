import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Link, Loader2, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";

interface AvatarUploaderProps {
  onImageSelected: (imageUrl: string) => void;
  initialImage?: string;
}

export function AvatarUploader({ onImageSelected, initialImage }: AvatarUploaderProps) {
  const [imageUrl, setImageUrl] = useState<string>(initialImage || "");
  const [urlInput, setUrlInput] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrlInput(e.target.value);
  };

  const handleUrlSubmit = () => {
    if (!urlInput) {
      toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
      return;
    }

    setPreviewUrl(urlInput);
    setImageUrl(urlInput);
    onImageSelected(urlInput);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPEG, PNG, GIF, or WebP image.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);

      // Create a local preview
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      // Upload to Supabase
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('avatar-images')
        .upload(`public/${fileName}`, file);

      if (error) {
        throw error;
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('avatar-images')
        .getPublicUrl(`public/${fileName}`);

      const uploadedUrl = urlData.publicUrl;
      setImageUrl(uploadedUrl);
      onImageSelected(uploadedUrl);

      toast({
        title: "Success",
        description: "Avatar uploaded successfully",
      });
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload avatar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    setImageUrl("");
    setUrlInput("");
    onImageSelected("");
  };

  return (
    <div className="space-y-4">
      {previewUrl ? (
        <div className="relative w-full max-w-xs mx-auto">
          <img
            src={previewUrl}
            alt="Avatar preview"
            className="w-full h-auto rounded-full aspect-square object-cover"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleRemoveImage}
            type="button"
            className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm hover:bg-white"
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="url">URL</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="space-y-4 py-4">
            <div className="flex flex-col items-center gap-4">
              <Label
                htmlFor="avatar-upload"
                className="w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Click to upload an image
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  JPEG, PNG, GIF or WebP (max 5MB)
                </span>
              </Label>
              <Input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                ref={fileInputRef}
                disabled={isUploading}
              />
              {isUploading && (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Uploading...</span>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="url" className="space-y-4 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="avatar-url">Image URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="avatar-url"
                    placeholder="https://example.com/image.jpg"
                    value={urlInput}
                    onChange={handleUrlChange}
                  />
                  <Button type="button" onClick={handleUrlSubmit} size="sm">
                    <Link className="h-4 w-4 mr-2" />
                    Use
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
} 