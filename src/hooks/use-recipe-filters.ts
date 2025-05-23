
import { useState, useMemo, useCallback } from 'react';
import { Recipe } from '@/types/recipe';

interface UseRecipeFiltersProps {
  recipes: Recipe[];
}

export function useRecipeFilters(recipes: Recipe[]) {
  const [mealTypeFilters, setMealTypeFilters] = useState<string[]>([]);
  const [dietaryFilters, setDietaryFilters] = useState<string[]>([]);
  const [difficultyFilters, setDifficultyFilters] = useState<string[]>([]);
  const [cuisineFilters, setCuisineFilters] = useState<string[]>([]);
  const [cookingMethodFilters, setCookingMethodFilters] = useState<string[]>([]);
  const [cookTimeRange, setCookTimeRange] = useState<number[]>([15, 120]);
  const [caloriesRange, setCaloriesRange] = useState<number>(1000);

  // Compute all active filters for display
  const activeFilters = useMemo(() => {
    return [
      ...mealTypeFilters,
      ...dietaryFilters,
      ...difficultyFilters,
      ...cuisineFilters,
      ...cookingMethodFilters,
    ];
  }, [
    mealTypeFilters,
    dietaryFilters,
    difficultyFilters,
    cuisineFilters,
    cookingMethodFilters,
  ]);

  // Determine if any filter is active
  const isFiltered = useMemo(() => {
    return (
      activeFilters.length > 0 ||
      cookTimeRange[0] !== 15 ||
      cookTimeRange[1] !== 120 ||
      caloriesRange !== 1000
    );
  }, [activeFilters, cookTimeRange, caloriesRange]);

  // Apply all filters to recipes
  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe) => {
      // Get categories safely
      const categories = typeof recipe.categories === 'object' && recipe.categories 
        ? recipe.categories 
        : {};
      
      // Filter by meal type
      if (
        mealTypeFilters.length > 0 &&
        (!categories || !hasMealType(categories, mealTypeFilters))
      ) {
        return false;
      }

      // Filter by dietary restrictions
      if (
        dietaryFilters.length > 0 &&
        (!categories || !hasDietaryRestrictions(categories, dietaryFilters))
      ) {
        return false;
      }

      // Filter by difficulty level
      if (
        difficultyFilters.length > 0 &&
        (!categories || !hasDifficultyLevel(categories, difficultyFilters))
      ) {
        return false;
      }

      // Filter by cuisine type
      if (
        cuisineFilters.length > 0 &&
        (!categories || !hasCuisineType(categories, cuisineFilters))
      ) {
        return false;
      }

      // Filter by cooking method
      if (
        cookingMethodFilters.length > 0 &&
        (!categories || !hasCookingMethod(categories, cookingMethodFilters))
      ) {
        return false;
      }

      // Filter by cook time
      const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);
      if (totalTime < cookTimeRange[0] || totalTime > cookTimeRange[1]) {
        return false;
      }

      // Filter by calories
      if (recipe.estimated_calories && recipe.estimated_calories > caloriesRange) {
        return false;
      }

      // If it passes all filters, include it
      return true;
    });
  }, [
    recipes,
    mealTypeFilters,
    dietaryFilters,
    difficultyFilters,
    cuisineFilters,
    cookingMethodFilters,
    cookTimeRange,
    caloriesRange,
  ]);

  // Helper functions to safely check categories
  function hasMealType(categories: any, filters: string[]): boolean {
    if (!categories || typeof categories !== 'object') return false;
    const mealType = categories.meal_type;
    if (!mealType) return false;
    return filters.includes(String(mealType));
  }

  function hasDietaryRestrictions(categories: any, filters: string[]): boolean {
    if (!categories || typeof categories !== 'object') return false;
    const restrictions = categories.dietary_restrictions;
    if (!restrictions) return false;
    if (Array.isArray(restrictions)) {
      return restrictions.some(r => filters.includes(String(r)));
    }
    return filters.includes(String(restrictions));
  }

  function hasDifficultyLevel(categories: any, filters: string[]): boolean {
    if (!categories || typeof categories !== 'object') return false;
    const level = categories.difficulty_level;
    if (!level) return false;
    return filters.includes(String(level));
  }

  function hasCuisineType(categories: any, filters: string[]): boolean {
    if (!categories || typeof categories !== 'object') return false;
    const cuisine = categories.cuisine_type;
    if (!cuisine) return false;
    return filters.includes(String(cuisine));
  }

  function hasCookingMethod(categories: any, filters: string[]): boolean {
    if (!categories || typeof categories !== 'object') return false;
    const method = categories.cooking_method;
    if (!method) return false;
    if (Array.isArray(method)) {
      return method.some(m => filters.includes(String(m)));
    }
    return filters.includes(String(method));
  }

  // Format utilities
  const formatTime = useCallback((minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }, []);

  const formatCalories = useCallback((calories: number) => {
    return `${calories} kcal`;
  }, []);

  // Filter toggle utility
  const toggleFilter = useCallback((category: string, value: string, currentFilters: string[], setFilters: (filters: string[]) => void) => {
    if (currentFilters.includes(value)) {
      setFilters(currentFilters.filter(f => f !== value));
    } else {
      setFilters([...currentFilters, value]);
    }
  }, []);

  // Get active filter count
  const getActiveFilterCount = useCallback(() => {
    return activeFilters.length + (cookTimeRange[0] !== 15 || cookTimeRange[1] !== 120 ? 1 : 0) + (caloriesRange !== 1000 ? 1 : 0);
  }, [activeFilters, cookTimeRange, caloriesRange]);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setMealTypeFilters([]);
    setDietaryFilters([]);
    setDifficultyFilters([]);
    setCuisineFilters([]);
    setCookingMethodFilters([]);
    setCookTimeRange([15, 120]);
    setCaloriesRange(1000);
  }, []);

  return {
    filteredRecipes,
    mealTypeFilters,
    dietaryFilters,
    difficultyFilters,
    cuisineFilters,
    cookingMethodFilters,
    cookTimeRange,
    caloriesRange,
    activeFilters,
    isFiltered,
    setMealTypeFilters,
    setDietaryFilters,
    setDifficultyFilters,
    setCuisineFilters,
    setCookingMethodFilters,
    setCookTimeRange,
    setCaloriesRange,
    toggleFilter,
    formatTime,
    formatCalories,
    getActiveFilterCount,
    resetFilters
  };
}
