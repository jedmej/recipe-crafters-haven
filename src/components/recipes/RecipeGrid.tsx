import { memo, useState } from "react";
import { RecipeCard } from "./RecipeCard";
import { SearchAndActions } from "./SearchAndActions";
import { FilterPanel } from "./FilterPanel";
import { Database } from "@/integrations/supabase/types";

type Recipe = Database['public']['Tables']['recipes']['Row'];

interface RecipeGridProps {
  recipes: Recipe[];
  selectedRecipes: string[];
  onRecipeClick: (recipeId: string) => void;
  onRecipeLongPress: (recipeId: string) => void;
  isSelectionMode: boolean;
  toggleSelectionMode: () => void;
  handleDeleteSelected: () => void;
}

export const RecipeGrid = memo(function RecipeGrid({
  recipes,
  selectedRecipes,
  onRecipeClick,
  onRecipeLongPress,
  isSelectionMode,
  toggleSelectionMode,
  handleDeleteSelected,
}: RecipeGridProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");
  
  // Filter handling state
  const [mealTypeFilters, setMealTypeFilters] = useState<string[]>([]);
  const [dietaryFilters, setDietaryFilters] = useState<string[]>([]);
  const [difficultyFilters, setDifficultyFilters] = useState<string[]>([]);
  const [cuisineFilters, setCuisineFilters] = useState<string[]>([]);
  const [cookingMethodFilters, setCookingMethodFilters] = useState<string[]>([]);
  const [cookTimeRange, setCookTimeRange] = useState<number[]>([0, 180]);
  const [caloriesRange, setCaloriesRange] = useState<number[]>([0, 2000]);

  const activeFilterCount = [
    mealTypeFilters.length,
    dietaryFilters.length,
    difficultyFilters.length,
    cuisineFilters.length,
    cookingMethodFilters.length,
    cookTimeRange[0] > 0 || cookTimeRange[1] < 180 ? 1 : 0,
    caloriesRange[0] > 0 || caloriesRange[1] < 2000 ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const toggleFilter = (value: string, currentFilters: string[], setFilters: (filters: string[]) => void) => {
    if (currentFilters.includes(value)) {
      setFilters(currentFilters.filter((f) => f !== value));
    } else {
      setFilters([...currentFilters, value]);
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins > 0 ? ` ${mins}m` : ""}`;
  };

  const formatCalories = (cal: number) => `${cal} cal`;

  return (
    <div className="flex flex-col gap-6">
      <SearchAndActions
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        isSelectionMode={isSelectionMode}
        toggleSelectionMode={toggleSelectionMode}
        selectedRecipes={selectedRecipes}
        handleDeleteSelected={handleDeleteSelected}
        isFiltersVisible={isFiltersVisible}
        setIsFiltersVisible={setIsFiltersVisible}
        activeFilterCount={activeFilterCount}
        view={view}
        onViewChange={setView}
      />

      {isFiltersVisible && (
        <FilterPanel
          mealTypeFilters={mealTypeFilters}
          dietaryFilters={dietaryFilters}
          difficultyFilters={difficultyFilters}
          cuisineFilters={cuisineFilters}
          cookingMethodFilters={cookingMethodFilters}
          cookTimeRange={cookTimeRange}
          caloriesRange={caloriesRange}
          formatTime={formatTime}
          formatCalories={formatCalories}
          toggleFilter={toggleFilter}
          setMealTypeFilters={setMealTypeFilters}
          setDietaryFilters={setDietaryFilters}
          setDifficultyFilters={setDifficultyFilters}
          setCuisineFilters={setCuisineFilters}
          setCookingMethodFilters={setCookingMethodFilters}
          setCookTimeRange={setCookTimeRange}
          setCaloriesRange={setCaloriesRange}
        />
      )}

      <div 
        className={
          view === "grid"
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            : "flex flex-col gap-2"
        }
      >
        {recipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            isSelected={selectedRecipes.includes(recipe.id)}
            isSelectionMode={isSelectionMode}
            onClick={onRecipeClick}
            onLongPress={onRecipeLongPress}
            variant={view === "list" ? "compact" : "default"}
          />
        ))}
      </div>
    </div>
  );
}); 