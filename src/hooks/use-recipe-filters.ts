
import { useState } from "react";
import { Database } from "@/integrations/supabase/types";

type Recipe = Database['public']['Tables']['recipes']['Row'];

interface UseRecipeFiltersProps {
  recipes: Recipe[] | undefined;
}

export function useRecipeFilters({ recipes }: UseRecipeFiltersProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [mealTypeFilters, setMealTypeFilters] = useState<string[]>([]);
  const [dietaryFilters, setDietaryFilters] = useState<string[]>([]);
  const [difficultyFilters, setDifficultyFilters] = useState<string[]>([]);
  const [cuisineFilters, setCuisineFilters] = useState<string[]>([]);
  const [cookingMethodFilters, setCookingMethodFilters] = useState<string[]>([]);
  const [cookTimeRange, setCookTimeRange] = useState<number[]>([0, 180]); // 0-180 minutes
  const [caloriesRange, setCaloriesRange] = useState<number[]>([0, 2000]); // 0-2000 calories
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);

  // Helper function to normalize category values
  const normalizeCategory = (value: any): string[] => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  };

  // Helper function to safely access categories
  const getCategory = (recipe: Recipe, path: string): any => {
    if (!recipe.categories) return null;
    const categories = typeof recipe.categories === 'object' ? recipe.categories : {};
    return (categories as any)[path];
  };

  // Apply all filters to recipes
  const filteredRecipes = recipes?.filter((recipe) => {
    if (!recipe) return false;

    // Text search filter
    const matchesSearch = 
      recipe.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      false;

    // Category filters - if no filters selected, show all
    const matchesMealType = mealTypeFilters.length === 0 || 
      mealTypeFilters.some(f => {
        const mealType = getCategory(recipe, 'meal_type');
        return mealType && mealType.toString().toLowerCase() === f.toLowerCase();
      });

    const matchesDietary = dietaryFilters.length === 0 || 
      dietaryFilters.some(f => {
        const restrictions = getCategory(recipe, 'dietary_restrictions');
        return restrictions && normalizeCategory(restrictions)
          .some(r => r.toString().toLowerCase() === f.toLowerCase());
      });

    const matchesDifficulty = difficultyFilters.length === 0 || 
      difficultyFilters.some(f => {
        const difficulty = getCategory(recipe, 'difficulty_level');
        return difficulty && difficulty.toString().toLowerCase() === f.toLowerCase();
      });

    const matchesCuisine = cuisineFilters.length === 0 || 
      cuisineFilters.some(f => {
        const cuisine = getCategory(recipe, 'cuisine_type');
        return cuisine && cuisine.toString().toLowerCase() === f.toLowerCase();
      });

    const matchesCookingMethod = cookingMethodFilters.length === 0 || 
      cookingMethodFilters.some(f => {
        const method = getCategory(recipe, 'cooking_method');
        return method && normalizeCategory(method)
          .some(m => m.toString().toLowerCase() === f.toLowerCase());
      });

    // Time and calories filters
    const cookTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);
    const matchesCookTime = cookTime >= cookTimeRange[0] && cookTime <= cookTimeRange[1];

    const calories = recipe.estimated_calories || 0;
    const matchesCalories = calories >= caloriesRange[0] && calories <= caloriesRange[1];

    return matchesSearch && 
           matchesMealType && 
           matchesDietary && 
           matchesDifficulty && 
           matchesCuisine && 
           matchesCookingMethod &&
           matchesCookTime &&
           matchesCalories;
  }) || [];

  // Helper function to toggle a filter value
  const toggleFilter = (value: string, currentFilters: string[], setFilters: (filters: string[]) => void) => {
    if (value === "all") {
      setFilters([]);
      return;
    }
    
    setFilters(prev => {
      if (prev.includes(value)) {
        return prev.filter(f => f !== value);
      }
      return [...prev, value];
    });
  };

  // Helper function to count active filters
  const getActiveFilterCount = () => {
    return mealTypeFilters.length + 
           dietaryFilters.length + 
           difficultyFilters.length + 
           cuisineFilters.length + 
           cookingMethodFilters.length +
           // Add 1 if time range is not default
           (cookTimeRange[0] !== 0 || cookTimeRange[1] !== 180 ? 1 : 0) +
           // Add 1 if calories range is not default
           (caloriesRange[0] !== 0 || caloriesRange[1] !== 2000 ? 1 : 0);
  };

  // Reset all filters
  const resetFilters = () => {
    setMealTypeFilters([]);
    setDietaryFilters([]);
    setDifficultyFilters([]);
    setCuisineFilters([]);
    setCookingMethodFilters([]);
    setCookTimeRange([0, 180]);
    setCaloriesRange([0, 2000]);
    setSearchTerm("");
  };

  // Format time helper
  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Format calories helper
  const formatCalories = (cal: number) => {
    return `${cal} cal`;
  };

  return {
    searchTerm,
    setSearchTerm,
    mealTypeFilters,
    setMealTypeFilters,
    dietaryFilters,
    setDietaryFilters,
    difficultyFilters,
    setDifficultyFilters,
    cuisineFilters,
    setCuisineFilters,
    cookingMethodFilters,
    setCookingMethodFilters,
    cookTimeRange,
    setCookTimeRange,
    caloriesRange,
    setCaloriesRange,
    isFiltersVisible,
    setIsFiltersVisible,
    filteredRecipes,
    toggleFilter,
    getActiveFilterCount,
    resetFilters,
    formatTime,
    formatCalories
  };
}
