import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { IngredientsSectionProps } from "./types";
import { useTranslation } from "react-i18next";

const IngredientsSection = memo(
  ({ 
    ingredients, 
    chosenPortions, 
    onPortionsChange, 
    portionDescription, 
    suggestedPortions,
    measurementSystem,
    onMeasurementSystemChange
  }: IngredientsSectionProps) => {
    const { t } = useTranslation("recipes");
    
    return (
      <Card className="overflow-hidden rounded-[48px] border-0 bg-[#E4E7DF]">
        <CardContent className="p-6">
          <div className="flex flex-col space-y-4">
            <h2 className="text-2xl font-heading">{t("details.ingredients")}</h2>
            
            {/* Portions and Measurement Controls */}
            <div className="flex flex-col md:flex-row gap-4 justify-between mb-4">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={chosenPortions}
                  onChange={(e) => onPortionsChange(Number(e.target.value))}
                  className="w-16 px-3 py-2 border rounded-md"
                />
                <span className="text-sm text-muted-foreground">
                  {portionDescription || t("details.servings")}
                  {suggestedPortions && ` (${t("details.suggested")}: ${suggestedPortions})`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{t("details.metric")}</span>
                <button
                  onClick={onMeasurementSystemChange}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    measurementSystem === 'imperial' ? 'bg-primary' : 'bg-gray-200'
                  }`}
                  role="switch"
                  aria-checked={measurementSystem === 'imperial'}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      measurementSystem === 'imperial' ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-sm font-medium">{t("details.imperial")}</span>
              </div>
            </div>
            
            {/* Ingredients List */}
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
    );
  }
);

export default IngredientsSection; 