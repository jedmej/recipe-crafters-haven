import { FileText, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface EmptyStateProps {
  searchTerm?: string;
  onGenerateRecipe?: () => void;
  onClearSearch?: () => void;
  generateButtonText?: string;
  shouldGenerateImage?: boolean;
  setShouldGenerateImage?: (value: boolean) => void;
}

export function EmptyState({ 
  searchTerm, 
  onGenerateRecipe, 
  onClearSearch,
  generateButtonText = "Generate Recipe Now",
  shouldGenerateImage = false,
  setShouldGenerateImage
}: EmptyStateProps) {
  const navigate = useNavigate();
  
  if (searchTerm) {
    return (
      <Card className="max-w-2xl mx-auto border-none rounded-[48px]">
        <CardContent className="pt-6 pb-8 px-6 text-center">
          <div className="bg-orange-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-8 w-8 text-orange-500" />
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No recipes found for "{searchTerm}"
          </h3>
          
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            No worries! We can create a custom recipe for you based on your search. 
            Our AI will craft something delicious just for you.
          </p>
          
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 mb-2">
              <Switch 
                id="generate-image-empty" 
                checked={shouldGenerateImage} 
                onCheckedChange={setShouldGenerateImage}
              />
              <Label htmlFor="generate-image-empty" className="font-medium">Generate Image</Label>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={onGenerateRecipe}
                variant="default"
                className="bg-orange-500 hover:bg-orange-600 text-white h-[48px] rounded-[500px]"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {generateButtonText}
              </Button>
              
              <Button 
                onClick={onClearSearch}
                variant="outline"
                className="h-[48px] rounded-[500px] border-gray-300"
              >
                <X className="h-4 w-4 mr-2" />
                Clear Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Default empty state when not searching
  return (
    <div className="text-center py-12">
      <FileText className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-4 text-lg font-medium text-gray-900">No recipes found</h3>
      <p className="mt-2 text-gray-600">
        Get started by creating a new recipe
      </p>
    </div>
  );
}