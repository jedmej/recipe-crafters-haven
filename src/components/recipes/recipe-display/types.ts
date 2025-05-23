
import { RecipeData } from "@/types/recipe";
import { ReactNode } from "react";

export interface RecipeDisplayProps {
  recipe: RecipeData;
  scaledRecipe: RecipeData;
  chosenPortions: number;
  onPortionsChange: (portions: number) => void;
  onSave: () => void;
  isSaving: boolean;
  measurementSystem: 'metric' | 'imperial';
  onMeasurementSystemChange: () => void;
  onImageUpdate?: (imageUrl: string) => Promise<void>;
  onAddToGroceryList?: () => void;
  isAddingToGroceryList?: boolean;
  onEditOrGenerate: () => void;
  onBack: () => void;
  isGeneratingImage?: boolean;
}

export interface CategoryItemProps {
  icon: ReactNode;
  label: string;
  value: string | string[];
  variant: string;
}

export interface TimeNutritionItemProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  originalValue?: string | number;
  showOriginal: boolean;
  unit?: string;
}

export type ActionButtonsAction = 
  | { type: 'START_FAVORITE_TOGGLE' }
  | { type: 'FAVORITE_TOGGLE_SUCCESS' }
  | { type: 'FAVORITE_TOGGLE_ERROR', payload: Error };

export interface ActionButtonsState {
  isToggling: boolean;
  error: Error | null;
}

export interface ActionButtonsProps {
  recipeId: string;
  isFavorite: boolean;
  onDelete: () => void;
}

export interface ImageControlsProps {
  onFileUpload: (file: File) => Promise<void>;
  onUrlUpload: (url: string) => Promise<void>;
  onGenerate: () => void;
  isGenerating: boolean;
}

export interface RecipeImageProps {
  imageUrl?: string;
  title: string;
  recipe?: RecipeData;
  onImageUpdate?: (imageUrl: string) => Promise<void>;
  isGeneratingImage?: boolean;
  onEditOrGenerate?: () => void;
  onSave?: () => void;
  isSaving?: boolean;
}

export interface RecipeCategoriesProps {
  recipe: RecipeData;
}

export interface TimeNutritionProps {
  recipe: RecipeData;
  scaledRecipe: RecipeData;
  showOriginal: boolean;
}

export interface ActionButtonsRowProps {
  recipe: RecipeData;
  onAddToGroceryList?: () => void;
  isAddingToGroceryList?: boolean;
  onEditOrGenerate: () => void;
  onDelete: () => void;
  setShowCookingMode: (show: boolean) => void;
}

export interface MeasurementToggleProps {
  measurementSystem: 'metric' | 'imperial';
  onMeasurementSystemChange: () => void;
}

export interface PortionsInputProps {
  portions: number;
  onPortionsChange: (portions: number) => void;
  onSave: () => void;
  isSaving: boolean;
}

export interface IngredientsSectionProps {
  ingredients: RecipeData['ingredients'];
  chosenPortions: number;
  onPortionsChange: (portions: number) => void;
  portionDescription?: string;
  suggestedPortions?: number;
  measurementSystem: 'metric' | 'imperial';
  onMeasurementSystemChange: () => void;
}

export interface InstructionsSectionProps {
  instructions: RecipeData['instructions'];
}

export interface RecipeDescriptionProps {
  description: string;
  className?: string;
}

export interface CookingModeWrapperProps {
  showCookingMode: boolean;
  setShowCookingMode: (show: boolean) => void;
  recipe: RecipeData;
}

export interface RecipeContentProps {
  recipe: RecipeData;
  scaledRecipe: RecipeData;
  chosenPortions: number;
  onPortionsChange: (portions: number) => void;
  onSave: () => void;
  isSaving: boolean;
  measurementSystem: 'metric' | 'imperial';
  onMeasurementSystemChange: () => void;
  onAddToGroceryList?: () => void;
  isAddingToGroceryList?: boolean;
  onEditOrGenerate: () => void;
  onDelete: () => void;
  setShowCookingMode: (show: boolean) => void;
}

// Define a Todo interface for the GroceryListItems component
export interface Todo {
  id: string;  // Changed from number to string
  title: string;
  completed: boolean;
}
