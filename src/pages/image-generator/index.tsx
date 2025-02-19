import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const GenerateImagePage = () => {
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const generateImage = async () => {
    if (!prompt) {
      toast({
        title: 'Error',
        description: 'Please enter a prompt',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      if (data.imageUrl) {
        setGeneratedImage(data.imageUrl);
      } else {
        throw new Error('Failed to generate image');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate image',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Generate Recipe Image</h1>
        
        <div className="space-y-4">
          <Input
            placeholder="Enter your image description..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          
          <Button 
            onClick={generateImage}
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