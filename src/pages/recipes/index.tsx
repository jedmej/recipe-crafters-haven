import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { NewRecipeActions } from "@/components/recipes/NewRecipeActions";
import { SearchAndActions } from "@/components/recipes/SearchAndActions";
import { FilterPanel } from "@/components/recipes/FilterPanel";
import { RecipeCount } from "@/components/recipes/RecipeCount";
import { EmptyState } from "@/components/recipes/EmptyState";
import { useRecipes } from "@/hooks/use-recipes";
import { useRecipeFilters } from "@/hooks/use-recipe-filters";
import { useRecipeSelection } from "@/hooks/use-recipe-selection";

export default function RecipesPage() {
  const navigate = useNavigate();
  const { data: recipes, isLoading } = useRecipes();
  
  const { 
    searchTerm, setSearchTerm,
    mealTypeFilters, setMealTypeFilters,
    dietaryFilters, setDietaryFilters,
    difficultyFilters, setDifficultyFilters,
    cuisineFilters, setCuisineFilters,
    cookingMethodFilters, setCookingMethodFilters,
    cookTimeRange, setCookTimeRange,
    caloriesRange, setCaloriesRange,
    isFiltersVisible, setIsFiltersVisible,
    filteredRecipes,
    toggleFilter,
    getActiveFilterCount,
    resetFilters,
    formatTime,
    formatCalories
  } = useRecipeFilters({ recipes });

  const {
    selectedRecipes,
    isSelectionMode,
    toggleRecipeSelection,
    handleDeleteSelected,
    toggleSelectionMode
  } = useRecipeSelection();

  const handleCardClick = (recipeId: string, event: React.MouseEvent) => {
    if (isSelectionMode) {
      toggleRecipeSelection(recipeId);
    } else {
      navigate(`/recipes/${recipeId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const recipesToDisplay = filteredRecipes || [];
  const hasRecipes = recipesToDisplay.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <style>
        {`
          @keyframes gentleShake {
            0% { transform: rotate(0deg) scale(1); }
            25% { transform: rotate(-0.5deg) scale(1.005); }
            75% { transform: rotate(0.5deg) scale(1.005); }
            85% { transform: rotate(0.2deg) scale(1.002); }
            95% { transform: rotate(-0.1deg) scale(1.001); }
            100% { transform: rotate(0deg) scale(1); }
          }
        `}
      </style>
      <div className="max-w-7xl mx-auto">
        {/* New Recipe Section */}
        <NewRecipeActions />

        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">
            My Recipes
          </h1>

          {/* Search and Controls Section */}
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
              activeFilterCount={getActiveFilterCount()}
            />

            {/* Recipe Count */}
            <RecipeCount 
              filteredCount={recipesToDisplay.length}
              totalCount={recipes?.length || 0}
              hasActiveFilters={getActiveFilterCount() > 0}
              onClearFilters={resetFilters}
            />

            {/* Filter Tags Panel */}
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
          </div>
        </div>

        {hasRecipes ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-6">
            {recipesToDisplay.map((recipe) => (
              <RecipeCard 
                key={recipe.id}
                recipe={recipe}
                isSelected={selectedRecipes.includes(recipe.id)}
                isSelectionMode={isSelectionMode}
                onClick={handleCardClick}
              />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}
