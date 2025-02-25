import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useImageGeneration } from '@/features/recipes/hooks/useImageGeneration';

const GenerateImagePage = () => {
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();
  const { generateImage, isLoading } = useImageGeneration();

  const handleGenerateImage = async () => {
    if (!prompt) {
      toast({
        title: 'Error',
        description: 'Please enter a prompt',
        variant: 'destructive'
      });
      return;
    }

    try {
      const imageUrl = await generateImage(prompt);
      if (imageUrl) {
        setGeneratedImage(imageUrl);
      } else {
        throw new Error('Failed to generate image');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate image',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
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
            placeholder="Enter your image description..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          
          <Button 
            onClick={handleGenerateImage}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate Image
          </Button>
        </div>

        {generatedImage && (
          <div className="mt-6">
            <img
              src={generatedImage}
              alt="Generated recipe image"
              className="w-full rounded-lg shadow-lg"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerateImagePage; 