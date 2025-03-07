import { memo, useMemo } from "react";
import CategoryItem from "./CategoryItem";
import { RecipeCategoriesProps } from "./types";

const RecipeCategories = memo(
  ({ recipe }: RecipeCategoriesProps) => {
    const categories = recipe.categories;
    
    if (!categories) return null;
    
    // Only render categories that exist to reduce unnecessary rendering
    const hasCategories = useMemo(() => {
      return categories.meal_type || 
             categories.difficulty_level || 
             categories.cuisine_type || 
             categories.cooking_method || 
             categories.dietary_restrictions;
    }, [
      categories.meal_type,
      categories.difficulty_level,
      categories.cuisine_type,
      categories.cooking_method,
      categories.dietary_restrictions
    ]);
    
    if (!hasCategories) return null;
    
    return (
      <div className="overflow-hidden">
        <div className="flex flex-wrap gap-4">
          {categories.meal_type && (
            <CategoryItem 
              icon={null}
              label="Meal Type"
              value={categories.meal_type}
              variant="meal"
            />
          )}
          
          {categories.difficulty_level && (
            <CategoryItem 
              icon={null}
              label="Difficulty Level"
              value={categories.difficulty_level}
              variant="difficulty"
            />
          )}
          
          {categories.cuisine_type && (
            <CategoryItem 
              icon={null}
              label="Cuisine Type"
              value={categories.cuisine_type}
              variant="cuisine"
            />
          )}
          
          {categories.cooking_method && (
            <CategoryItem 
              icon={null}
              label="Cooking Method"
              value={categories.cooking_method}
              variant="cooking"
            />
          )}
          
          {categories.dietary_restrictions && (
            <CategoryItem 
              icon={null}
              label="Dietary Restrictions"
              value={categories.dietary_restrictions}
              variant="dietary"
            />
          )}
        </div>
      </div>
    );
  }
);

export default RecipeCategories; 