import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useImageGeneration } from '@/features/recipes/hooks/useImageGeneration';

interface ImageGeneratorProps {
  prompt?: string;
  onImageGenerated?: (imageUrl: string) => void;
  embedded?: boolean;
}

const ImageGenerator: React.FC<ImageGeneratorProps> = ({ 
  prompt: initialPrompt, 
  onImageGenerated,
  embedded = false
}) => {
  const [promptText, setPromptText] = useState('');
  const [generatedImage, setGeneratedImage] = useState('');
  const [hasGenerated, setHasGenerated] = useState(false);
  const generationStartedRef = useRef(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { generateImage, isLoading } = useImageGeneration();

  const handleGenerateImage = useCallback(async (promptToUse = promptText) => {
    if (!promptToUse.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt",
        variant: "destructive",
      });
      return;
    }

    if (hasGenerated || generationStartedRef.current) {
      return; // Prevent multiple generations
    }

    generationStartedRef.current = true;
    setGeneratedImage('');

    const imageUrl = await generateImage(promptToUse);
    
    if (imageUrl) {
      setGeneratedImage(imageUrl);
      setHasGenerated(true);
      if (onImageGenerated) {
        onImageGenerated(imageUrl);
      }
    }
    generationStartedRef.current = false;
  }, [promptText, generateImage, toast, onImageGenerated, hasGenerated]);

  useEffect(() => {
    if (initialPrompt && !hasGenerated && !generationStartedRef.current) {
      setPromptText(initialPrompt);
      handleGenerateImage(initialPrompt);
    }

    return () => {
      generationStartedRef.current = false;
    };
  }, [initialPrompt, handleGenerateImage, hasGenerated]);

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
                handleGenerateImage();
              }
            }}
            disabled={isLoading}
          />
          
          <Button 
            onClick={() => handleGenerateImage()}
            disabled={isLoading || !promptText.trim()}
            className="w-full"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Generating...' : 'Generate Image'}
          </Button>
        </div>

        {generatedImage && (
          <div className="mt-6">
            <img
              src={generatedImage}
              alt="Generated recipe image"
              className="w-full rounded-lg shadow-lg"
              crossOrigin="anonymous"
              onError={(e) => {
                console.error('Image loading error:', e);
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