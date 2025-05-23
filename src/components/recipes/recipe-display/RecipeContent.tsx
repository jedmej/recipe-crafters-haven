
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
    
    return (
      <>
        {/* Remove the title positioned over the faded part of the image since it's now in the main content */}
        
        <main className="relative z-20 w-full bg-[#fff] shadow-lg pb-24">
          <div className="mx-auto max-w-[800px] h-full relative">
            
            <div className="w-full space-y-8 relative">
              {/* Title and description moved to be inside the main content area */}
              <div className="px-4 pt-8">
                <h1 className="text-4xl sm:text-5xl font-serif font-medium text-[#222]">
                  {recipe.title}
                </h1>
                <div className="mt-2 text-[#222]/90">
                  <RecipeDescription description={recipe.description} className="text-[#222]/90" />
                </div>
              </div>
              
              <ActionButtonsRow 
                recipe={recipe}
                onAddToGroceryList={onAddToGroceryList}
                isAddingToGroceryList={isAddingToGroceryList}
                onEditOrGenerate={onEditOrGenerate}
                onDelete={onDelete}
                setShowCookingMode={setShowCookingMode}
              />
              
              <TimeNutrition 
                scaledRecipe={scaledRecipe} 
                recipe={recipe} 
                showOriginal={showOriginal} 
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full px-4">
                <div className="flex flex-col space-y-4">
                  <IngredientsSection 
                    ingredients={scaledRecipe.ingredients} 
                    chosenPortions={chosenPortions}
                    onPortionsChange={onPortionsChange}
                    portionDescription={recipe.portion_description}
                    suggestedPortions={recipe.suggested_portions}
                    measurementSystem={measurementSystem}
                    onMeasurementSystemChange={onMeasurementSystemChange}
                  />
                </div>
                
                <InstructionsSection instructions={scaledRecipe.instructions} />
              </div>
              
              <RecipeCategories recipe={recipe} />
            </div>
          </div>
        </main>
      </>
    );
  }
);

export default RecipeContent;
