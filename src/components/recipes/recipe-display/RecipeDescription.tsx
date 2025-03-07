import { memo } from "react";
import { RecipeDescriptionProps } from "./types";

const RecipeDescription = memo(
  ({ description }: RecipeDescriptionProps) => {
    if (!description) return null;
    
    return (
      <p className="text-lg text-gray-700 w-full mt-4">
        {description}
      </p>
    );
  }
);

export default RecipeDescription; 