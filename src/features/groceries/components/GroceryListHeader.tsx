import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ImageUpload } from "@/components/ImageUpload";
import { Link } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

interface GroceryListHeaderProps {
  title: string;
  imageUrl?: string | null;
  recipeId?: string | null;
  recipeTitle?: string | null;
  onDelete: () => void;
  onUpdateImage: (url: string) => void;
  onRecategorize?: () => void;
}

export function GroceryListHeader({
  title,
  imageUrl,
  recipeId,
  recipeTitle,
  onDelete,
  onUpdateImage,
  onRecategorize,
}: GroceryListHeaderProps) {
  const [isRecategorizing, setIsRecategorizing] = useState(false);

  const handleRecategorize = async () => {
    if (!onRecategorize || isRecategorizing) return;
    
    console.log("Recategorize button clicked");
    setIsRecategorizing(true);
    
    try {
      await onRecategorize();
    } catch (error) {
      console.error("Error during recategorization:", error);
    } finally {
      setIsRecategorizing(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          {recipeId && recipeTitle && (
            <p className="text-gray-600 mt-2">
              From recipe:{" "}
              <Link to={`/recipes/${recipeId}`} className="text-blue-600 hover:underline">
                {recipeTitle}
              </Link>
            </p>
          )}
        </div>
        <div className="flex gap-3">
          {onRecategorize && (
            <Button
              variant="outline"
              onClick={handleRecategorize}
              className="flex items-center gap-2"
              disabled={isRecategorizing}
            >
              <RefreshCw className={`h-4 w-4 ${isRecategorizing ? 'animate-spin' : ''}`} />
              {isRecategorizing ? "Categorizing..." : "Recategorize"}
            </Button>
          )}
          <Button
            variant="destructive"
            onClick={onDelete}
          >
            Delete List
          </Button>
        </div>
      </div>

      <div className="mt-6">
        <ImageUpload
          imageUrl={imageUrl}
          onImageUrlChange={onUpdateImage}
          aspectRatio="16:9"
          width={800}
          height={450}
        />
      </div>
    </Card>
  );
} 