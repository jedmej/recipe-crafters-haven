import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fal } from "@fal-ai/client";

// Update interface to match the actual API response structure from the documentation
interface RecraftResponse {
  data: {
    images: Array<{
      url: string;
      content_type?: string;
      file_name?: string;
      file_size?: number;
      file_data?: string;
    }>;
  };
  requestId: string;
}

interface ImageGeneratorProps {
  prompt?: string;
  onImageGenerated?: (imageUrl: string) => void;
  embedded?: boolean;
}

// Configure FAL client
fal.config({
  credentials: "1bdc7126-51ab-40f8-bcc5-e304def1a789:d2df7a52cb9f954e7374b8e3828da39c"
});

const ImageGenerator: React.FC<ImageGeneratorProps> = ({ 
  prompt: initialPrompt, 
  onImageGenerated,
  embedded = false
}) => {
  const [promptText, setPromptText] = useState('');
  const [generatedImage, setGeneratedImage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (initialPrompt) {
      setPromptText(initialPrompt);
      generateImage(initialPrompt);
    }
  }, [initialPrompt]);

  const generateImage = async (promptToUse = promptText) => {
    if (!promptToUse.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError('');
    setGeneratedImage('');

    try {
      const result = await fal.subscribe('fal-ai/recraft-20b', {
        input: {
          prompt: `high quality professional food photography of ${promptToUse.trim()}, appetizing, masterful plating, studio lighting, 8k, professional lighting, bokeh, depth of field, food magazine style`,
          image_size: "square_hd",
          style: "realistic_image"
        },
        pollInterval: 500,
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            const latestMessage = update.logs[update.logs.length - 1]?.message;
            if (latestMessage) {
              toast({
                title: 'Processing',
                description: latestMessage,
                duration: 2000,
              });
            }
          }
        }
      });

      console.log('API Response:', result);

      // According to the API docs, the response contains an array of File objects
      if (!result.data?.images?.[0]) {
        throw new Error('No image generated');
      }

      const imageData = result.data.images[0];
      
      // The API returns a File object with a url property
      if (!imageData.url) {
        throw new Error('No image URL in response');
      }

      setGeneratedImage(imageData.url);
      
      toast({
        title: "Success",
        description: "Image generated successfully",
      });

      if (onImageGenerated) {
        onImageGenerated(imageData.url);
      }
    } catch (err) {
      console.error('Generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate image');
      toast({
        title: "Error",
        description: "Failed to generate image",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (embedded) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="p-0 hover:bg-transparent"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-3xl font-bold">Generate Recipe Image</h1>
        </div>
        
        <div className="space-y-4">
          <Input
            placeholder="Enter your recipe description (e.g., 'chocolate cake with strawberries')..."
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isLoading) {
                generateImage();
              }
            }}
            disabled={isLoading}
          />
          
          <Button 
            onClick={() => generateImage()}
            disabled={isLoading || !promptText.trim()}
            className="w-full"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Generating...' : 'Generate Image'}
          </Button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {generatedImage && (
          <div className="mt-6">
            <img
              src={generatedImage}
              alt="Generated recipe image"
              className="w-full rounded-lg shadow-lg"
              crossOrigin="anonymous"
              onError={(e) => {
                console.error('Image loading error:', e);
                setError('Failed to load generated image');
                setGeneratedImage('');
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageGenerator; 