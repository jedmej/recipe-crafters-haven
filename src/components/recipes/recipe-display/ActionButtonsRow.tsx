import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Basket, SpinnerGap } from "@phosphor-icons/react";
import { ChefHat } from "lucide-react";
import { ActionButtonsRowProps } from "./types";

// Constants
const PRIMARY_BUTTON_CLASSES = "flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-4 py-2 rounded-full";
const SECONDARY_BUTTON_CLASSES = "flex items-center justify-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90 h-12 px-4 py-2 rounded-full";

const ActionButtonsRow = memo(
  ({ 
    recipe,
    onAddToGroceryList, 
    isAddingToGroceryList, 
    onEditOrGenerate,
    setShowCookingMode
  }: ActionButtonsRowProps) => {
    if (!onAddToGroceryList) return null;
    
    const handleStartCooking = () => {
      setShowCookingMode(true);
    };
    
    return (
      <div className="grid grid-cols-2 gap-4">
        <Button
          onClick={onAddToGroceryList}
          disabled={isAddingToGroceryList}
          className={SECONDARY_BUTTON_CLASSES}
        >
          {isAddingToGroceryList ? (
            <SpinnerGap className="h-4 w-4 animate-spin" />
          ) : (
            <Basket className="h-4 w-4" weight="duotone" />
          )}
          Add ingredients to grocery list
        </Button>
        
        <Button 
          onClick={handleStartCooking}
          className={PRIMARY_BUTTON_CLASSES}
        >
          <ChefHat className="h-4 w-4" />
          Start Cooking
        </Button>
      </div>
    );
  }
);

export default ActionButtonsRow; 