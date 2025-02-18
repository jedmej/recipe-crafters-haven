
import { Clock, Flame } from "lucide-react";

interface TimeAndNutritionProps {
  prepTime?: number | null;
  cookTime?: number | null;
  estimatedCalories?: number | null;
  scaledCalories?: number | null;
  caloriesPerServing?: number | null;
  scaledCaloriesPerServing?: number | null;
  showOriginalCalories?: boolean;
}

export function TimeAndNutrition({
  prepTime,
  cookTime,
  estimatedCalories,
  scaledCalories,
  caloriesPerServing,
  scaledCaloriesPerServing,
  showOriginalCalories
}: TimeAndNutritionProps) {
  const hasTimeInfo = prepTime || cookTime;
  const hasNutritionInfo = estimatedCalories;

  if (!hasTimeInfo && !hasNutritionInfo) {
    return (
      <div className="space-y-2">
        <h3 className="font-semibold">Time & Nutrition</h3>
        <div className="text-sm text-muted-foreground">
          <span>Time and nutrition information not available</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="font-semibold">Time & Nutrition</h3>
      <div className="space-y-1 text-sm text-muted-foreground">
        {hasTimeInfo && (
          <div className="flex flex-wrap gap-4">
            {prepTime && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Prep: {prepTime} mins</span>
              </div>
            )}
            {cookTime && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Cook: {cookTime} mins</span>
              </div>
            )}
          </div>
        )}
        {hasNutritionInfo && (
          <div className="flex flex-col gap-1 mt-2">
            <div className="flex items-center gap-1">
              <Flame className="h-4 w-4" />
              <span>
                {scaledCalories} cal total
                {scaledCaloriesPerServing && ` (${scaledCaloriesPerServing} cal/serving)`}
              </span>
            </div>
            {showOriginalCalories && (
              <span className="text-xs text-muted-foreground pl-5">
                Original: {estimatedCalories} cal total
                {caloriesPerServing && ` (${caloriesPerServing} cal/serving)`}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
