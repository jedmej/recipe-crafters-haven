import { memo, useCallback, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { RecipeDisplayProps } from "./types";
import RecipeImage from "./RecipeImage";
import RecipeContent from "./RecipeContent";
import CookingModeWrapper from "./CookingModeWrapper";
import { AsyncHandler } from "./utils";

export function RecipeDisplay({
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
  isGeneratingImage,
}: RecipeDisplayProps) {
  const { toast } = useToast();
  const [imageState, setImageState] = useState({
    isUpdating: false,
    error: null as Error | null
  });
  const [showCookingMode, setShowCookingMode] = useState(false);

  // Core image update function
  const updateImage: AsyncHandler<[string]> = useCallback(async (imageUrl: string) => {
    if (!onImageUpdate) return;
    setImageState(prev => ({ ...prev, isUpdating: true, error: null }));
    toast({
      title: "Saving image...",
      description: "Please wait while we save your changes.",
    });
    await onImageUpdate(imageUrl);
    toast({
      title: "Success",
      description: "Recipe image has been updated.",
    });
  }, [onImageUpdate, toast]);

  // Handler with error handling
  const handleImageUpdate: AsyncHandler<[string]> = useCallback(async (imageUrl: string) => {
    try {
      await updateImage(imageUrl);
    } catch (error) {
      setImageState(prev => ({ ...prev, error: error instanceof Error ? error : new Error(String(error)) }));
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update the recipe image. Please try again."
      });
    } finally {
      setImageState(prev => ({ ...prev, isUpdating: false }));
    }
  }, [updateImage, toast]);

  const handleDelete = useCallback(() => {
    // This is a placeholder for the delete functionality
    console.log("Delete recipe:", recipe.id);
  }, [recipe.id]);

  return (
    <div className="w-full min-h-screen bg-[#f5f5f5] overflow-x-hidden p-0 m-0">
      <div className="relative">
        <RecipeImage
          imageUrl={recipe.imageUrl}
          title={recipe.title}
          recipe={recipe}
          onImageUpdate={onImageUpdate ? handleImageUpdate : undefined}
          isGeneratingImage={isGeneratingImage}
          onEditOrGenerate={onEditOrGenerate}
          onSave={onSave}
          isSaving={isSaving}
        />
      </div>

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
        onDelete={handleDelete}
        setShowCookingMode={setShowCookingMode}
      />

      <CookingModeWrapper
        showCookingMode={showCookingMode}
        setShowCookingMode={setShowCookingMode}
        recipe={recipe}
      />
    </div>
  );
}