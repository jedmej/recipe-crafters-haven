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

  // Apply all filters to recipes
  const filteredRecipes = recipes?.filter((recipe) => {
    if (!recipe) return false;

    // Text search filter
    const matchesSearch = 
      recipe.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      false;

    // Helper function to normalize category values
    const normalizeCategory = (value: string | string[] | null | undefined): string[] => {
      if (!value) return [];
      return Array.isArray(value) ? value : [value];
    };

    // Category filters - if no filters selected, show all
    const matchesMealType = mealTypeFilters.length === 0 || 
      (recipe.categories?.meal_type && mealTypeFilters.some(f => 
        recipe.categories?.meal_type?.toLowerCase() === f.toLowerCase()
      ));

    const matchesDietary = dietaryFilters.length === 0 || 
      (recipe.categories?.dietary_restrictions && dietaryFilters.some(f => 
        normalizeCategory(recipe.categories?.dietary_restrictions)
          .some(r => r.toLowerCase() === f.toLowerCase())
      ));

    const matchesDifficulty = difficultyFilters.length === 0 || 
      (recipe.categories?.difficulty_level && difficultyFilters.some(f => 
        recipe.categories?.difficulty_level?.toLowerCase() === f.toLowerCase()
      ));

    const matchesCuisine = cuisineFilters.length === 0 || 
      (recipe.categories?.cuisine_type && cuisineFilters.some(f => 
        recipe.categories?.cuisine_type?.toLowerCase() === f.toLowerCase()
      ));

    const matchesCookingMethod = cookingMethodFilters.length === 0 || 
      (recipe.categories?.cooking_method && cookingMethodFilters.some(f => 
        normalizeCategory(recipe.categories?.cooking_method)
          .some(m => m.toLowerCase() === f.toLowerCase())
      ));

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