import { memo, useMemo } from "react";
import CategoryItem from "./CategoryItem";
import { RecipeCategoriesProps } from "./types";
import { useTranslation } from "react-i18next";

const RecipeCategories = memo(
  ({ recipe }: RecipeCategoriesProps) => {
    const { t } = useTranslation("recipes");
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

    // Helper function to normalize category value
    const normalizeCategory = (value: string | string[] | undefined | null): string | string[] | null => {
      if (!value) return null;
      if (Array.isArray(value)) {
        return value.map(v => v.toLowerCase());
      }
      return value.toLowerCase();
    };
    
    return (
      <div className="overflow-hidden px-4">
        <div className="flex flex-wrap gap-4">
          {categories.meal_type && (
            <CategoryItem 
              icon={null}
              label={t("filters.mealType")}
              value={t(`filters.mealTypes.${normalizeCategory(categories.meal_type)}`)}
              variant="meal"
            />
          )}
          
          {categories.difficulty_level && (
            <CategoryItem 
              icon={null}
              label={t("filters.difficulty")}
              value={t(`filters.difficultyLevels.${normalizeCategory(categories.difficulty_level)}`)}
              variant="difficulty"
            />
          )}
          
          {categories.cuisine_type && (
            <CategoryItem 
              icon={null}
              label={t("filters.cuisine")}
              value={t(`filters.cuisineTypes.${normalizeCategory(categories.cuisine_type)}`)}
              variant="cuisine"
            />
          )}
          
          {categories.cooking_method && (
            <CategoryItem 
              icon={null}
              label={t("filters.cookingMethod")}
              value={Array.isArray(categories.cooking_method)
                ? categories.cooking_method.map(method => t(`filters.cookingMethods.${method.toLowerCase()}`))
                : t(`filters.cookingMethods.${categories.cooking_method.toLowerCase()}`)}
              variant="cooking"
            />
          )}
          
          {categories.dietary_restrictions && (
            <CategoryItem 
              icon={null}
              label={t("filters.dietary")}
              value={Array.isArray(categories.dietary_restrictions)
                ? categories.dietary_restrictions.map(diet => t(`filters.dietaryTypes.${diet.toLowerCase()}`))
                : t(`filters.dietaryTypes.${categories.dietary_restrictions.toLowerCase()}`)}
              variant="dietary"
            />
          )}
        </div>
      </div>
    );
  }
);

export default RecipeCategories; 