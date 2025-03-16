import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface RecipeGenerationCardProps {
  searchTerm?: string;
  onGenerateRecipe?: () => void;
  generateButtonText?: string;
  isUrl?: boolean;
  shouldGenerateImage?: boolean;
  setShouldGenerateImage?: (value: boolean) => void;
}

export function RecipeGenerationCard({
  searchTerm,
  onGenerateRecipe,
  generateButtonText = "Generate Recipe Now",
  isUrl = false,
  shouldGenerateImage = false,
  setShouldGenerateImage
}: RecipeGenerationCardProps) {
  const navigate = useNavigate();

  const handleCreateNew = () => {
    navigate('/recipes/new');
  };

  return (
    <Card className="border-dashed border-2 border-gray-300 rounded-[24px] h-full flex flex-col justify-center hover:border-orange-300 transition-colors">
      <CardContent className="pt-6 pb-8 px-6 text-center flex flex-col items-center justify-center h-full">
        <div className="bg-orange-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="h-8 w-8 text-orange-500" />
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {searchTerm 
            ? `Create recipe for "${searchTerm}"`
            : "Create a new recipe"}
        </h3>
        
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          {searchTerm 
            ? "Our AI will craft something delicious based on your search."
            : "Add your own recipe or let our AI help you create something delicious."}
        </p>
        
        <div className="flex flex-col gap-3 w-full max-w-xs">
          {searchTerm ? (
            <>
              <div className="flex items-center gap-2 mb-2">
                <Switch 
                  id="generate-image-search" 
                  checked={shouldGenerateImage} 
                  onCheckedChange={setShouldGenerateImage}
                />
                <Label htmlFor="generate-image-search" className="font-medium">Generate Image</Label>
              </div>
              <Button 
                onClick={onGenerateRecipe}
                variant="default"
                className="bg-orange-500 hover:bg-orange-600 text-white h-[48px] rounded-[500px] w-full"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {generateButtonText}
              </Button>
            </>
          ) : (
            <>
              <Button 
                onClick={handleCreateNew}
                variant="default"
                className="bg-orange-500 hover:bg-orange-600 text-white h-[48px] rounded-[500px] w-full"
              >
                Create New Recipe
              </Button>
              <Button 
                onClick={() => navigate('/recipes/import-ai')}
                variant="outline"
                className="h-[48px] rounded-[500px] border-gray-300 w-full"
              >
                Import with AI
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 