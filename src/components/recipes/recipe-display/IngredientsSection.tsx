import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import PortionsInput from "./PortionsInput";
import MeasurementToggle from "./MeasurementToggle";
import { IngredientsSectionProps } from "./types";

const IngredientsSection = memo(
  ({ ingredients }: IngredientsSectionProps) => (
    <Card className="overflow-hidden rounded-[48px] border-0 bg-[#E4E7DF]">
      <CardContent className="p-6">
        <div className="flex flex-col space-y-4">
          <h2 className="text-2xl font-heading">Ingredients</h2>
          <ul className="space-y-2">
            {ingredients.map((ingredient, index) => (
              <li key={index} className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                <span>{ingredient}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
);

export default IngredientsSection; 