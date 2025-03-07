import { memo } from "react";
import { CookingMode } from "../CookingMode";
import { CookingModeWrapperProps } from "./types";

const CookingModeWrapper = memo(
  ({ 
    showCookingMode, 
    setShowCookingMode, 
    recipe 
  }: CookingModeWrapperProps) => {
    if (!showCookingMode) return null;
    
    const handleClose = () => {
      setShowCookingMode(false);
    };
    
    return (
      <CookingMode 
        recipe={recipe} 
        onClose={handleClose} 
      />
    );
  }
);

export default CookingModeWrapper; 