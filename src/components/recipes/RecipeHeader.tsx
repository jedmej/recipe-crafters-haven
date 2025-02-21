import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Edit, Trash, ListPlus } from "lucide-react";
import { MeasurementSystem } from "@/lib/types";

interface RecipeHeaderProps {
  title: string;
  originalServings: number;
  desiredServings: number | '';
  measurementSystem: MeasurementSystem;
  onServingsChange: (value: string) => void;
  onMeasurementSystemChange: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCreateGroceryList: () => void;
  isDeleting: boolean;
  recipe: any;
}

export function RecipeHeader({
  title,
  originalServings,
  desiredServings,
  measurementSystem,
  onServingsChange,
  onMeasurementSystemChange,
  onEdit,
  onDelete,
  onCreateGroceryList,
  isDeleting,
  recipe
}: RecipeHeaderProps) {
  return (
    <div className="flex flex-row items-center justify-between">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Servings:</span>
            <Input
              type="number"
              min="1"
              value={desiredServings}
              onChange={(e) => onServingsChange(e.target.value)}
              className="w-20"
            />
          </div>
          <span className="text-sm text-muted-foreground">
            (Original: {originalServings} {recipe.portion_description})
            {recipe.suggested_portions && (
              <span className="ml-2">(Suggested: {recipe.suggested_portions} {recipe.portion_description})</span>
            )}
          </span>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={onCreateGroceryList}
          className="gap-2"
        >
          <ListPlus className="h-4 w-4" />
          Create List
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={onEdit}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="destructive"
          size="icon"
          onClick={onDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
