import { memo, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Alarm, Oven, Fire } from "@phosphor-icons/react";
import TimeNutritionItem from "./TimeNutritionItem";
import { TimeNutritionProps } from "./types";

const TimeNutrition = memo(
  ({ recipe, scaledRecipe, showOriginal }: TimeNutritionProps) => {
    // Only render if we have time or nutrition data
    const hasTimeOrNutrition = useMemo(() => {
      return scaledRecipe?.prep_time || 
             scaledRecipe?.cook_time || 
             scaledRecipe?.estimated_calories;
    }, [
      scaledRecipe?.prep_time,
      scaledRecipe?.cook_time,
      scaledRecipe?.estimated_calories
    ]);
    
    if (!hasTimeOrNutrition) return null;
    
    return (
      <Card className="overflow-hidden rounded-[48px] border-0 bg-[#F2F2F2]">
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row justify-between gap-4 p-6">
            {scaledRecipe?.prep_time && (
              <TimeNutritionItem
                icon={<Alarm className="h-6 w-6 text-primary" weight="duotone" />}
                label="Prep Time"
                value={scaledRecipe.prep_time}
                originalValue={recipe.prep_time}
                showOriginal={showOriginal}
                unit="mins"
              />
            )}
            
            {scaledRecipe?.cook_time && (
              <TimeNutritionItem
                icon={<Oven className="h-6 w-6 text-primary" weight="duotone" />}
                label="Cook Time"
                value={scaledRecipe.cook_time}
                originalValue={recipe.cook_time}
                showOriginal={showOriginal}
                unit="mins"
              />
            )}
            
            {scaledRecipe?.estimated_calories && (
              <TimeNutritionItem
                icon={<Fire className="h-6 w-6 text-primary" weight="duotone" />}
                label="Calories"
                value={scaledRecipe.estimated_calories}
                originalValue={recipe.estimated_calories}
                showOriginal={showOriginal}
                unit="total"
              />
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
);

export default TimeNutrition; 