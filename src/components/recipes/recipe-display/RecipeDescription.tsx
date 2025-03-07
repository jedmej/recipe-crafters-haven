import { memo } from "react";
import { RecipeDescriptionProps } from "./types";

const RecipeDescription = memo(
  ({ description, className = "" }: RecipeDescriptionProps & { className?: string }) => {
    if (!description) return null;
    
    return (
      <p className={`text-lg w-full mt-4 ${className}`}>
        {description}
      </p>
    );
  }
);

export default RecipeDescription; 