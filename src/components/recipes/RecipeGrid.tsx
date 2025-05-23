import { useEffect, useState, useCallback } from "react";
import { RecipeCard } from "./RecipeCard";
import { FilterPanel } from "./FilterPanel";
import { RecipeCount } from "./RecipeCount";
import { ViewToggle } from "./ViewToggle";
import { useRecipeFilters } from "@/hooks/use-recipe-filters";
import { Recipe } from "@/types/recipe";

interface RecipeGridProps {
  recipes: Recipe[];
  isLoading: boolean;
  isSearching: boolean;
  searchQuery: string;
  onSelectRecipe: (recipeId: string) => void;
}

export function RecipeGrid({ recipes, isLoading, isSearching, searchQuery, onSelectRecipe }) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const {
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
  } = useRecipeFilters(recipes);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const isGrid = view === "grid";

  const renderEmptyState = () => {
    if (isLoading) {
      return <div className="text-center">Loading recipes...</div>;
    }

    if (isSearching && searchQuery && recipes.length === 0) {
      return (
        <div className="text-center">
          No recipes found for "{searchQuery}".
        </div>
      );
    }

    if (recipes.length === 0) {
      return <div className="text-center">No recipes found.</div>;
    }

    return null;
  };

  // Format time from minutes to hours and minutes
  const formatTime = useCallback((minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }, []);

  // Update this function to match the FilterPanel props
  const toggleFilter = (category: string, value: string, currentFilters: string[], setFilters: (filters: string[]) => void) => {
    if (currentFilters.includes(value)) {
      setFilters(currentFilters.filter((filter) => filter !== value));
    } else {
      setFilters([...currentFilters, value]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <RecipeCount count={filteredRecipes.length} total={recipes.length} isFiltered={isFiltered} />
        
        <div className="flex items-center gap-4">
          <FilterPanel
            mealTypeFilters={mealTypeFilters}
            dietaryFilters={dietaryFilters}
            difficultyFilters={difficultyFilters}
            cuisineFilters={cuisineFilters}
            cookingMethodFilters={cookingMethodFilters}
            cookTimeRange={cookTimeRange}
            caloriesRange={caloriesRange}
            formatTime={formatTime}
            activeFilters={activeFilters}
            setMealTypeFilters={setMealTypeFilters}
            setDietaryFilters={setDietaryFilters}
            setDifficultyFilters={setDifficultyFilters}
            setCuisineFilters={setCuisineFilters}
            setCookingMethodFilters={setCookingMethodFilters}
            setCookTimeRange={setCookTimeRange}
            setCaloriesRange={setCaloriesRange}
            toggleFilter={toggleFilter}
          />
          <ViewToggle view={view} onViewChange={setView} />
        </div>
      </div>

      {renderEmptyState() || (
        <div className={isGrid ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "flex flex-col gap-4"}>
          {filteredRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              isGrid={isGrid}
              onSelect={() => onSelectRecipe(recipe.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
