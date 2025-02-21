import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Edit, Trash } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MeasurementSystem } from "@/lib/types";

interface RecipeActionsProps {
  recipeId: string;
  isDeleting: boolean;
  handleDelete: () => Promise<void>;
  measurementSystem: MeasurementSystem;
  toggleMeasurementSystem: () => void;
}

export function RecipeActions({
  recipeId,
  isDeleting,
  handleDelete,
  measurementSystem,
  toggleMeasurementSystem
}: RecipeActionsProps) {
  return (
    <div className="flex flex-col space-y-4 p-4">
      {/* Recipe Controls Section */}
      <div className="flex items-center justify-between">
        <Label htmlFor="measurement" className="text-base font-medium">
          Imperial:
        </Label>
        <Switch
          id="measurement"
          checked={measurementSystem === 'imperial'}
          onCheckedChange={toggleMeasurementSystem}
          className="data-[state=checked]:bg-primary"
        />
      </div>

      {/* Action Buttons Section */}
      <div className="flex gap-2 pt-2">
        <Button
          variant="outline"
          className="flex-1 h-12 text-base font-medium"
          asChild
        >
          <Link to={`/recipes/${recipeId}/edit`} className="flex items-center justify-center">
            <Edit className="h-5 w-5 mr-2" />
            Edit
          </Link>
        </Button>
        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={isDeleting}
          className="flex-1 h-12 text-base font-medium"
        >
          <Trash className="h-5 w-5 mr-2" />
          {isDeleting ? 'Deleting...' : 'Delete'}
        </Button>
      </div>
    </div>
  );
} 