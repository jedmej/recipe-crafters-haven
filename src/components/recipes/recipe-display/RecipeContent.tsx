import { memo } from "react";
import RecipeDescription from "./RecipeDescription";
import ActionButtonsRow from "./ActionButtonsRow";
import TimeNutrition from "./TimeNutrition";
import IngredientsSection from "./IngredientsSection";
import InstructionsSection from "./InstructionsSection";
import RecipeCategories from "./RecipeCategories";
import { RecipeContentProps } from "./types";

const RecipeContent = memo(
  ({
    recipe,
    scaledRecipe,
    chosenPortions,
    onPortionsChange,
    onSave,
    isSaving,
    measurementSystem,
    onMeasurementSystemChange,
    onAddToGroceryList,
    isAddingToGroceryList,
    onEditOrGenerate,
    onDelete,
    setShowCookingMode
  }: RecipeContentProps) => {
    const showOriginal = chosenPortions !== recipe.suggested_portions;
    const mainMarginTop = recipe.imageUrl ? "mt-[50vh]" : "mt-[50vh]";
    
    return (
      <main className={`relative z-20 ${mainMarginTop} w-full bg-white rounded-t-3xl shadow-lg pb-24`}>
        <div className="relative -mt-[25vh] w-full">
          
        </div>
        
        <div className="max-w-[800px] mx-auto space-y-8 px-4 sm:px-6">

        <div className="relative pt-12 pb-4 px-4 sm:px-6 mx-auto">
            <h1 className="text-4xl sm:text-5xl font-serif font-medium text-gray-900">
              {recipe.title}
            </h1>
            <RecipeDescription description={recipe.description} />
          </div>

          <ActionButtonsRow 
            recipe={recipe}
            onAddToGroceryList={onAddToGroceryList}
            isAddingToGroceryList={isAddingToGroceryList}
            onEditOrGenerate={onEditOrGenerate}
            setShowCookingMode={setShowCookingMode}
          />
          
          <TimeNutrition 
            scaledRecipe={scaledRecipe} 
            recipe={recipe} 
            showOriginal={showOriginal} 
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-heading">Ingredients</h2>
              </div>
              <div className="flex flex-col md:flex-row gap-4 justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={chosenPortions}
                    onChange={(e) => onPortionsChange(Number(e.target.value))}
                    className="w-16 px-3 py-2 border rounded-md"
                  />
                  <span className="text-sm text-muted-foreground">
                    {recipe.portion_description || "Servings"}
                    {recipe.suggested_portions && ` (Suggested: ${recipe.suggested_portions})`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Metric</span>
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
                  <span className="text-sm font-medium">Imperial</span>
                </div>
              </div>
              <IngredientsSection ingredients={scaledRecipe.ingredients} />
            </div>
            
            <InstructionsSection instructions={scaledRecipe.instructions} />
          </div>
          
          <RecipeCategories recipe={recipe} />
        </div>
      </main>
    );
  }
);

export default RecipeContent; 