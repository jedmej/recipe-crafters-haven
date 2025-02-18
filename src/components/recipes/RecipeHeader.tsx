
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Edit, Trash } from "lucide-react";
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
  isDeleting: boolean;
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
  isDeleting
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
            (Original: {originalServings})
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="measurement-system"
            checked={measurementSystem === 'metric'}
            onCheckedChange={onMeasurementSystemChange}
          />
          <Label htmlFor="measurement-system">
            {measurementSystem === 'imperial' ? 'Imperial' : 'Metric'} Units
          </Label>
        </div>
      </div>
      <div className="flex gap-2">
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
