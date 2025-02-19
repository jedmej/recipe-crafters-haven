
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, Flame, Loader2, Plus } from "lucide-react";
import { RecipeData } from "@/types/recipe";

interface RecipeDisplayProps {
  recipe: RecipeData;
  scaledRecipe: RecipeData;
  chosenPortions: number;
  onPortionsChange: (portions: number) => void;
  onSave: () => void;
  isSaving: boolean;
}

export function RecipeDisplay({
  recipe,
  scaledRecipe,
  chosenPortions,
  onPortionsChange,
  onSave,
  isSaving,
}: RecipeDisplayProps) {
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">{recipe.description}</p>

      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        {scaledRecipe?.prep_time && (
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>Prep: {scaledRecipe.prep_time} mins</span>
            {chosenPortions !== recipe.suggested_portions && (
              <span className="text-xs">
                (Original: {recipe.prep_time} mins)
              </span>
            )}
          </div>
        )}
        {scaledRecipe?.cook_time && (
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>Cook: {scaledRecipe.cook_time} mins</span>
            {chosenPortions !== recipe.suggested_portions && (
              <span className="text-xs">
                (Original: {recipe.cook_time} mins)
              </span>
            )}
          </div>
        )}
        {scaledRecipe?.estimated_calories && (
          <div className="flex items-center gap-1">
            <Flame className="h-4 w-4" />
            <span>{scaledRecipe.estimated_calories} cal total</span>
            {chosenPortions !== recipe.suggested_portions && (
              <span className="text-xs">
                (Original: {recipe.estimated_calories} cal)
              </span>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold">Portions</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="1"
              value={chosenPortions}
              onChange={(e) => onPortionsChange(Number(e.target.value))}
              className="w-20"
            />
            <span className="text-sm text-muted-foreground">
              {recipe.portion_description}
            </span>
          </div>
          <span className="text-sm text-muted-foreground">
            (Suggested: {recipe.suggested_portions})
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold">Ingredients:</h3>       <ul className="list-disc pl-5 space-y-1">
          {scaledRecipe.ingredients.map((ingredient, index) => (
            <li key={index}>{ingredient}</li>
          ))}
        </ul>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold">Instructions:</h3>
        <ol className="list-decimal pl-5 space-y-1">
          {scaledRecipe.instructions.map((instruction, index) => (
            <li key={index}>{instruction}</li>
          ))}
        </ol>
      </div>

      <Button 
        onClick={onSave}
        className="w-full gap-2"
        disabled={isSaving}
      >
        {isSaving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Plus className="h-4 w-4" />
            Save Recipe
          </>
        )}
      </Button>
    </div>
  );
}
