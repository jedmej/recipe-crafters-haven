import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ImageUpload } from "@/components/ImageUpload";
import { Link } from "react-router-dom";

interface GroceryListHeaderProps {
  title: string;
  imageUrl?: string | null;
  recipeId?: string | null;
  recipeTitle?: string | null;
  onDelete: () => void;
  onUpdateImage: (url: string) => void;
}

export function GroceryListHeader({
  title,
  imageUrl,
  recipeId,
  recipeTitle,
  onDelete,
  onUpdateImage,
}: GroceryListHeaderProps) {
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
        <Button
          variant="destructive"
          onClick={onDelete}
        >
          Delete List
        </Button>
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