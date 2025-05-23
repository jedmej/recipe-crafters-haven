
import { SpinnerGap, Sparkle, UploadSimple, Link } from "@phosphor-icons/react";
import { memo, useCallback, useRef, useState } from "react";
import { useImageGeneration } from "@/features/recipes/hooks/useImageGeneration";
import { useToast } from "@/hooks/use-toast";
import { AsyncHandler, SyncHandler, ValidateImageUrlOptions } from "./utils";
import { ImageControlsProps } from "./types";

const ImageControls = memo(({ 
  onFileUpload,
  onUrlUpload,
  onGenerate,
  isGenerating
}: ImageControlsProps) => {
  const [imageState, setImageState] = useState({
    showUrlInput: false,
    urlInput: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Toggle URL input visibility
  const toggleUrlInput: SyncHandler<[React.MouseEvent]> = useCallback((e) => {
    setImageState(prev => ({ 
      ...prev, 
      showUrlInput: !prev.showUrlInput 
    }));
  }, []);

  // Update URL input value
  const updateUrlInput: SyncHandler<[React.ChangeEvent<HTMLInputElement>]> = useCallback((e) => {
    setImageState(prev => ({ 
      ...prev, 
      urlInput: e.target.value 
    }));
  }, []);

  // Validate image URL
  const validateImageUrl = async (url: string): Promise<boolean> => {
    try {
      // Check if URL is valid
      new URL(url);
      
      // Check if image exists and can be loaded
      const response = await fetch(url, { method: 'HEAD' });
      
      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Invalid Image URL",
          description: "The URL does not point to a valid image. Please check and try again.",
        });
        return false;
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.startsWith('image/')) {
        toast({
          variant: "destructive",
          title: "Invalid Image URL",
          description: "The URL does not point to an image. Please provide a direct link to an image file.",
        });
        return false;
      }
      
      return true;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Invalid URL",
        description: "Please enter a valid URL.",
      });
      return false;
    }
  };

  // File upload handler
  const handleFileUpload: SyncHandler<[React.ChangeEvent<HTMLInputElement>]> = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const processFile = async (): Promise<void> => {
      return new Promise<void>((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async (e) => {
          try {
            const imageUrl = e.target?.result as string;
            if (imageUrl) {
              await onFileUpload(file);
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

    processFile().catch(error => {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload image. Please try again.",
      });
    });
  }, [onFileUpload, toast]);

  // URL submission handler
  const handleUrlSubmit: SyncHandler<[React.MouseEvent]> = useCallback((e) => {
    if (!imageState.urlInput.trim()) return;

    const processUrl = async (): Promise<void> => {
      const isValid = await validateImageUrl(imageState.urlInput);
      
      if (isValid) {
        await onUrlUpload(imageState.urlInput);
        setImageState(prev => ({
          ...prev,
          urlInput: "",
          showUrlInput: false
        }));
      }
    };

    processUrl().catch(error => {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add image from URL. Please try again.",
      });
    });
  }, [imageState.urlInput, onUrlUpload, toast]);

  return (
    <>
      <div className="flex gap-4">
        <button 
          className="flex items-center gap-1 px-4 h-12 bg-[#F5F5F5] rounded-full text-sm"
          onClick={onGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <SpinnerGap className="h-5 w-5 animate-spin" />
          ) : (
            <Sparkle className="h-5 w-5" weight="duotone" />
          )}
          <span>Generate image</span>
        </button>
        
        <button 
          className="flex items-center gap-1 px-4 h-12 bg-[#F5F5F5] rounded-full text-sm"
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadSimple className="h-5 w-5" weight="duotone" />
          <span>Upload</span>
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/*"
          className="hidden"
        />
        
        <button 
          className="flex items-center gap-1 px-4 h-12 bg-[#F5F5F5] rounded-full text-sm"
          onClick={toggleUrlInput}
        >
          <Link className="h-5 w-5" weight="duotone" />
          <span>URL</span>
        </button>
      </div>
      
      {imageState.showUrlInput && (
        <div className="absolute top-[calc(50%+32px)] left-1/2 transform -translate-x-1/2 flex gap-2 w-80">
          <input
            type="text"
            value={imageState.urlInput}
            onChange={updateUrlInput}
            placeholder="Enter image URL"
            className="flex-1 px-3 py-2 border rounded-md"
          />
          <button
            onClick={handleUrlSubmit}
            disabled={!imageState.urlInput.trim()}
            className="px-3 py-2 bg-gray-200 rounded-md"
          >
            Add
          </button>
        </div>
      )}
    </>
  );
});

export default ImageControls;
