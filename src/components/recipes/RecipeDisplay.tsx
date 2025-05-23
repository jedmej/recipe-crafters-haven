
import { memo } from "react";
import { RecipeDisplayProps } from "./recipe-display/types";
import RecipeContent from "./recipe-display/RecipeContent";
import RecipeImage from "./recipe-display/RecipeImage";
import CookingModeWrapper from "./recipe-display/CookingModeWrapper";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const RecipeDisplay = memo(
  ({ 
    recipe,
    scaledRecipe,
    chosenPortions,
    onPortionsChange,
    onSave,
    isSaving,
    measurementSystem,
    onMeasurementSystemChange,
    onImageUpdate,
    onAddToGroceryList,
    isAddingToGroceryList,
    onEditOrGenerate,
    onBack,
    isGeneratingImage
  }: RecipeDisplayProps) => {
    const [showCookingMode, setShowCookingMode] = useState(false);
    const isMobile = useMediaQuery("(max-width: 768px)");
    
    return (
      <div className="w-full relative">
        {/* Back button for mobile */}
        {isMobile && (
          <div className="absolute top-4 left-4 z-30">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onBack}
              className="h-10 w-10 rounded-full bg-white/70 backdrop-blur-sm hover:bg-white/90"
            >
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </Button>
          </div>
        )}
        
        {/* Recipe Hero Image */}
        <RecipeImage 
          imageUrl={recipe.image_url} 
          title={recipe.title}
          onImageUpdate={onImageUpdate}
          isGeneratingImage={isGeneratingImage}
        />
        
        {/* Main Recipe Content */}
        <RecipeContent 
          recipe={recipe}
          scaledRecipe={scaledRecipe}
          chosenPortions={chosenPortions}
          onPortionsChange={onPortionsChange}
          onSave={onSave}
          isSaving={isSaving}
          measurementSystem={measurementSystem}
          onMeasurementSystemChange={onMeasurementSystemChange}
          onAddToGroceryList={onAddToGroceryList}
          isAddingToGroceryList={isAddingToGroceryList}
          onEditOrGenerate={onEditOrGenerate}
          onDelete={onBack} // Using onBack as onDelete since they often serve the same purpose in this context
          setShowCookingMode={setShowCookingMode}
        />
        
        {/* Cooking Mode Component */}
        <CookingModeWrapper 
          showCookingMode={showCookingMode}
          setShowCookingMode={setShowCookingMode}
          recipe={recipe}
        />
      </div>
    );
  }
);

export { RecipeDisplay as default };
