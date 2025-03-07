import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { SearchAndActions } from "@/components/recipes/SearchAndActions";
import { FilterPanel } from "@/components/recipes/FilterPanel";
import { RecipeCount } from "@/components/recipes/RecipeCount";
import { EmptyState } from "@/components/recipes/EmptyState";
import { RecipeGenerationCard } from "@/components/recipes/RecipeGenerationCard";
import { useRecipes } from "@/hooks/use-recipes";
import { useRecipeFilters } from "@/hooks/use-recipe-filters";
import { useRecipeSelection } from "@/hooks/use-recipe-selection";
import { useFavorites } from "@/hooks/use-favorites";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState, useMemo } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";

export default function RecipesPage() {
  const navigate = useNavigate();
  const { data: recipes, isLoading } = useRecipes();
  const { favorites, favoritesData } = useFavorites();
  const [profile, setProfile] = useState<{
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null>(null);
  const [user, setUser] = useState<{
    id: string;
    email: string;
  } | null>(null);

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setUser(user);

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('full_name, username, avatar_url')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setProfile(profile);
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchUserAndProfile();
  }, []);

  const getDisplayName = () => {
    if (profile?.username) {
      return profile.username;
    } else if (profile?.full_name) {
      return profile.full_name.split(' ')[0];
    } else if (user?.email) {
      return user.email.split('@')[0];
    }
    return "there";
  };

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name[0].toUpperCase();
    } else if (profile?.username) {
      return profile.username[0].toUpperCase();
    } else if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };
  
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

  // Sort recipes to prioritize favorites
  const sortedRecipes = useMemo(() => {
    // Create a map of recipe IDs to their favorite timestamps for quick lookup
    const favoriteTimestamps = new Map();
    favoritesData.forEach(fav => {
      favoriteTimestamps.set(fav.recipe_id, new Date(fav.created_at));
    });

    return [...filteredRecipes].sort((a, b) => {
      const aIsFavorite = favorites.includes(a.id);
      const bIsFavorite = favorites.includes(b.id);
      
      // If both are favorites, sort by created_at timestamp (most recent first)
      if (aIsFavorite && bIsFavorite) {
        const aTimestamp = favoriteTimestamps.get(a.id);
        const bTimestamp = favoriteTimestamps.get(b.id);
        
        // Handle case where timestamps might be undefined
        if (!aTimestamp && !bTimestamp) return 0;
        if (!aTimestamp) return 1;
        if (!bTimestamp) return -1;
        
        // Sort in descending order (most recent first)
        return bTimestamp.getTime() - aTimestamp.getTime();
      }
      
      // If only one is a favorite, it comes first
      if (aIsFavorite && !bIsFavorite) return -1;
      if (!aIsFavorite && bIsFavorite) return 1;
      
      // If neither are favorites, maintain original order
      return 0;
    });
  }, [filteredRecipes, favorites, favoritesData]);

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

  // Handle long press on recipe card
  const handleLongPress = (recipeId: string) => {
    if (!isSelectionMode) {
      toggleSelectionMode();
      toggleRecipeSelection(recipeId);
    }
  };

  // Function to check if a string is a URL
  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleGenerateRecipe = () => {
    if (searchTerm) {
      if (isValidUrl(searchTerm)) {
        // If it's a URL, navigate to the import-ai page with the URL as a query parameter
        navigate(`/recipes/import-ai?url=${encodeURIComponent(searchTerm)}`);
      } else {
        // Otherwise, navigate to the inspire page with the search term as a query parameter
        navigate(`/recipes/inspire?query=${encodeURIComponent(searchTerm)}`);
      }
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const recipesToDisplay = sortedRecipes || [];
  const hasRecipes = recipesToDisplay.length > 0;
  const isUrl = searchTerm ? isValidUrl(searchTerm) : false;

  return (
    <div className="max-w-7xl mx-auto min-h-screen px-0 py-4 md:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-[48px] font-bold text-[#222222]">Hello, {getDisplayName()}</h1>
        <button 
          onClick={() => navigate('/profile')}
          className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>
        </button>
      </div>
      <div className="bg-[#F5F5F5] rounded-t-[48px] md:rounded-[48px] p-6 shadow-sm -mx-4 md:mx-8 lg:mx-0">
        <div className="mb-12">
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
            <AnimatePresence>
              {isFiltersVisible && (
                <motion.div
                  initial={{ opacity: 0, height: 0, scale: 0.98, transformOrigin: "top", overflow: "hidden" }}
                  animate={{ opacity: 1, height: "auto", scale: 1, overflow: "visible" }}
                  exit={{ opacity: 0, height: 0, scale: 0.98, overflow: "hidden" }}
                  transition={{ 
                    duration: 0.25, 
                    ease: [0.4, 0, 0.2, 1],
                    scale: { duration: 0.2 }
                  }}
                >
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
                </motion.div>
              )}
            </AnimatePresence>
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
                onLongPress={handleLongPress}
              />
            ))}
            {/* Always show the recipe generation card at the end of the list */}
            <RecipeGenerationCard 
              searchTerm={searchTerm}
              onGenerateRecipe={handleGenerateRecipe}
              generateButtonText={isUrl ? "Import with AI" : "Generate Recipe Now"}
              isUrl={isUrl}
            />
          </div>
        ) : (
          <EmptyState 
            searchTerm={searchTerm}
            onGenerateRecipe={handleGenerateRecipe}
            onClearSearch={handleClearSearch}
            generateButtonText={isUrl ? "Import with AI" : "Generate Recipe Now"}
          />
        )}
      </div>
    </div>
  );
}
