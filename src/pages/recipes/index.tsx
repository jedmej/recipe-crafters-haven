import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Plus, Loader2, Search, Bot, Trash, FileText, FileImage, Clock, Sparkles, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ALL_MEAL_TYPES,
  ALL_DIETARY_RESTRICTIONS,
  ALL_DIFFICULTY_LEVELS,
  ALL_CUISINE_TYPES,
  ALL_COOKING_METHODS,
} from "@/types/filters";
import {
  Slider
} from "@/components/ui/slider";

type Recipe = Database['public']['Tables']['recipes']['Row'];

export default function RecipesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecipes, setSelectedRecipes] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  
  // Update filter states to handle arrays
  const [mealTypeFilters, setMealTypeFilters] = useState<string[]>([]);
  const [dietaryFilters, setDietaryFilters] = useState<string[]>([]);
  const [difficultyFilters, setDifficultyFilters] = useState<string[]>([]);
  const [cuisineFilters, setCuisineFilters] = useState<string[]>([]);
  const [cookingMethodFilters, setCookingMethodFilters] = useState<string[]>([]);

  // Add new state for time and calories filters
  const [cookTimeRange, setCookTimeRange] = useState<number[]>([0, 180]); // 0-180 minutes
  const [caloriesRange, setCaloriesRange] = useState<number[]>([0, 2000]); // 0-2000 calories

  const { data: recipes, isLoading } = useQuery({
    queryKey: ['recipes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Recipe[];
    }
  });

  const filteredRecipes = recipes?.filter(recipe => {
    // Text search filter
    const matchesSearch = 
      recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.description?.toLowerCase().includes(searchTerm.toLowerCase());

    // Category filters - if no filters selected, show all
    const matchesMealType = mealTypeFilters.length === 0 || 
      (recipe.categories?.meal_type && mealTypeFilters.some(f => 
        f.toLowerCase() === recipe.categories.meal_type?.toLowerCase()
      ));

    const matchesDietary = dietaryFilters.length === 0 || 
      (recipe.categories?.dietary_restrictions && dietaryFilters.some(f => 
        f.toLowerCase() === recipe.categories.dietary_restrictions?.toLowerCase()
      ));

    const matchesDifficulty = difficultyFilters.length === 0 || 
      (recipe.categories?.difficulty_level && difficultyFilters.some(f => 
        f.toLowerCase() === recipe.categories.difficulty_level?.toLowerCase()
      ));

    const matchesCuisine = cuisineFilters.length === 0 || 
      (recipe.categories?.cuisine_type && cuisineFilters.some(f => 
        f.toLowerCase() === recipe.categories.cuisine_type?.toLowerCase()
      ));

    const matchesCookingMethod = cookingMethodFilters.length === 0 || 
      (recipe.categories?.cooking_method && cookingMethodFilters.some(f => 
        f.toLowerCase() === recipe.categories.cooking_method?.toLowerCase()
      ));

    // Add time and calories filters
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
  });

  const deleteRecipes = useMutation({
    mutationFn: async (recipeIds: string[]) => {
      const { error } = await supabase
        .from('recipes')
        .delete()
        .in('id', recipeIds);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      setSelectedRecipes([]);
      setIsSelectionMode(false);
      toast({
        title: "Recipes deleted",
        description: "Selected recipes have been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  });

  const handleCardClick = (recipeId: string, event: React.MouseEvent) => {
    if (isSelectionMode) {
      toggleRecipeSelection(recipeId);
    } else {
      navigate(`/recipes/${recipeId}`);
    }
  };

  const toggleRecipeSelection = (recipeId: string) => {
    setSelectedRecipes(prev => {
      const newSelection = prev.includes(recipeId)
        ? prev.filter(id => id !== recipeId)
        : [...prev, recipeId];
      
      if (newSelection.length === 0) {
        setIsSelectionMode(false);
      }
      
      return newSelection;
    });
  };

  const handleDeleteSelected = () => {
    deleteRecipes.mutate(selectedRecipes);
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      setSelectedRecipes([]);
    }
  };

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

  // Function to format time
  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Function to format calories
  const formatCalories = (cal: number) => {
    return `${cal} cal`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

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
        <div className="mb-16 p-6 sm:p-8 bg-gray-50 rounded-3xl shadow-sm">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 sm:mb-8">New Recipe</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-3xl">
            <Button 
              onClick={() => navigate("/recipes/ai-search")} 
              variant="outline" 
              className="gap-2 h-14 px-4 sm:px-6 text-base rounded-xl"
            >
              <Search className="h-5 w-5" />
              <span className="hidden sm:inline">AI Search</span>
              <span className="sm:hidden">Search</span>
            </Button>
            <Button 
              onClick={() => navigate("/recipes/import-ai")} 
              variant="outline" 
              className="gap-2 h-14 px-4 sm:px-6 text-base rounded-xl"
            >
              <Bot className="h-5 w-5" />
              <span className="hidden sm:inline">Import from URL</span>
              <span className="sm:hidden">Import</span>
            </Button>
            <Button 
              onClick={() => navigate("/recipes/inspire")} 
              variant="outline" 
              className="gap-2 h-14 px-4 sm:px-6 text-base rounded-xl"
            >
              <Sparkles className="h-5 w-5" />
              <span>Inspire Me</span>
            </Button>
            <Button 
              onClick={() => navigate("/recipes/new")} 
              className="gap-2 h-14 px-4 sm:px-6 text-base rounded-xl bg-gray-900 hover:bg-gray-800"
            >
              <Plus className="h-5 w-5" />
              <span>Add Recipe</span>
            </Button>
          </div>
        </div>

        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">
            My Recipes
          </h1>

          {/* Search and Controls Section */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Input
                  type="search"
                  placeholder="Search recipes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-5 pr-12 h-12 sm:h-14 text-base sm:text-lg bg-white border-none shadow-sm rounded-2xl"
                />
                <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className={cn(
                    "h-12 sm:h-14 px-4 sm:px-6 rounded-2xl border-none shadow-sm bg-white hover:bg-gray-50",
                    isFiltersVisible && "bg-gray-100 hover:bg-gray-100"
                  )}
                  onClick={() => setIsFiltersVisible(!isFiltersVisible)}
                >
                  <div className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    <span className="font-medium">Filters</span>
                    {getActiveFilterCount() > 0 && (
                      <div className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium">
                        {getActiveFilterCount()}
                      </div>
                    )}
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className={cn(
                    "h-12 sm:h-14 px-4 sm:px-6 rounded-2xl border-none shadow-sm bg-white hover:bg-gray-50",
                    isSelectionMode && "bg-gray-100 hover:bg-gray-100"
                  )}
                  onClick={toggleSelectionMode}
                >
                  {isSelectionMode ? "Cancel Selection" : "Select Multiple"}
                </Button>

                {isSelectionMode && selectedRecipes.length > 0 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="destructive" 
                        className="h-12 sm:h-14 px-4 sm:px-6 rounded-2xl shadow-sm"
                      >
                        <div className="flex items-center gap-2">
                          <Trash className="h-5 w-5" />
                          <span>Delete ({selectedRecipes.length})</span>
                        </div>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the selected recipes.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteSelected}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>

            {/* Recipe Count */}
            <div className="flex items-center justify-center bg-white shadow-sm rounded-2xl px-6 py-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-semibold text-gray-900">
                  {filteredRecipes?.length}
                </span>
                <span className="text-lg text-gray-500">
                  {filteredRecipes?.length !== recipes?.length ? (
                    <>
                      filtered from{" "}
                      <span className="text-lg font-semibold text-gray-900">
                        {recipes?.length}
                      </span>{" "}
                      total recipes
                    </>
                  ) : (
                    "total recipes"
                  )}
                </span>
              </div>
              {getActiveFilterCount() > 0 && (
                <Button
                  variant="ghost"
                  className="text-base font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 px-4 py-2 h-auto"
                  onClick={() => {
                    setMealTypeFilters([]);
                    setDietaryFilters([]);
                    setDifficultyFilters([]);
                    setCuisineFilters([]);
                    setCookingMethodFilters([]);
                    setCookTimeRange([0, 180]);
                    setCaloriesRange([0, 2000]);
                    setSearchTerm("");
                  }}
                >
                  Clear all filters
                </Button>
              )}
            </div>

            {/* Filter Tags Panel */}
            {isFiltersVisible && (
              <div className="bg-white shadow-sm rounded-2xl p-6 space-y-6 animate-in slide-in-from-top-2 duration-200">
                {/* Time Range Slider */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-base text-gray-900">Total Time</h3>
                    <span className="text-base text-gray-500">
                      {formatTime(cookTimeRange[0])} - {formatTime(cookTimeRange[1])}
                    </span>
                  </div>
                  <div className="pt-2 px-3">
                    <div className="relative">
                      <div className="absolute inset-x-0 h-2 bg-gray-100 rounded-full" />
                      <div
                        className="absolute h-2 bg-gray-900 rounded-full"
                        style={{
                          left: `${(cookTimeRange[0] / 180) * 100}%`,
                          right: `${100 - (cookTimeRange[1] / 180) * 100}%`
                        }}
                      />
                      <Slider
                        min={0}
                        max={180}
                        step={5}
                        value={cookTimeRange}
                        onValueChange={setCookTimeRange}
                        className="relative w-full"
                        thumbClassName="block h-7 w-7 rounded-full border-2 border-gray-900 bg-white shadow-md hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 cursor-grab active:cursor-grabbing"
                      />
                    </div>
                  </div>
                </div>

                {/* Calories Range Slider */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-base text-gray-900">Calories per Serving</h3>
                    <span className="text-base text-gray-500">
                      {formatCalories(caloriesRange[0])} - {formatCalories(caloriesRange[1])}
                    </span>
                  </div>
                  <div className="pt-2 px-3">
                    <div className="relative">
                      <div className="absolute inset-x-0 h-2 bg-gray-100 rounded-full" />
                      <div
                        className="absolute h-2 bg-gray-900 rounded-full"
                        style={{
                          left: `${(caloriesRange[0] / 2000) * 100}%`,
                          right: `${100 - (caloriesRange[1] / 2000) * 100}%`
                        }}
                      />
                      <Slider
                        min={0}
                        max={2000}
                        step={50}
                        value={caloriesRange}
                        onValueChange={setCaloriesRange}
                        className="relative w-full"
                        thumbClassName="block h-7 w-7 rounded-full border-2 border-gray-900 bg-white shadow-md hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 cursor-grab active:cursor-grabbing"
                      />
                    </div>
                  </div>
                </div>

                {/* Meal Types */}
                <div className="space-y-3">
                  <h3 className="font-medium text-sm text-gray-500">Meal Type</h3>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={mealTypeFilters.length === 0 ? "default" : "outline"}
                      size="sm"
                      className="rounded-full h-8"
                      onClick={() => setMealTypeFilters([])}
                    >
                      All
                    </Button>
                    {ALL_MEAL_TYPES.map((type) => (
                      <Button
                        key={type}
                        variant={mealTypeFilters.includes(type) ? "default" : "outline"}
                        size="sm"
                        className="rounded-full h-8"
                        onClick={() => toggleFilter(type, mealTypeFilters, setMealTypeFilters)}
                      >
                        {type}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Dietary Restrictions */}
                <div className="space-y-3">
                  <h3 className="font-medium text-sm text-gray-500">Dietary Restrictions</h3>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={dietaryFilters.length === 0 ? "default" : "outline"}
                      size="sm"
                      className="rounded-full h-8"
                      onClick={() => setDietaryFilters([])}
                    >
                      All
                    </Button>
                    {ALL_DIETARY_RESTRICTIONS.map((restriction) => (
                      <Button
                        key={restriction}
                        variant={dietaryFilters.includes(restriction) ? "default" : "outline"}
                        size="sm"
                        className="rounded-full h-8"
                        onClick={() => toggleFilter(restriction, dietaryFilters, setDietaryFilters)}
                      >
                        {restriction}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Difficulty Level */}
                <div className="space-y-3">
                  <h3 className="font-medium text-sm text-gray-500">Difficulty Level</h3>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={difficultyFilters.length === 0 ? "default" : "outline"}
                      size="sm"
                      className="rounded-full h-8"
                      onClick={() => setDifficultyFilters([])}
                    >
                      All
                    </Button>
                    {ALL_DIFFICULTY_LEVELS.map((level) => (
                      <Button
                        key={level}
                        variant={difficultyFilters.includes(level) ? "default" : "outline"}
                        size="sm"
                        className="rounded-full h-8"
                        onClick={() => toggleFilter(level, difficultyFilters, setDifficultyFilters)}
                      >
                        {level}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Cuisine Type */}
                <div className="space-y-3">
                  <h3 className="font-medium text-sm text-gray-500">Cuisine Type</h3>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={cuisineFilters.length === 0 ? "default" : "outline"}
                      size="sm"
                      className="rounded-full h-8"
                      onClick={() => setCuisineFilters([])}
                    >
                      All
                    </Button>
                    {ALL_CUISINE_TYPES.map((cuisine) => (
                      <Button
                        key={cuisine}
                        variant={cuisineFilters.includes(cuisine) ? "default" : "outline"}
                        size="sm"
                        className="rounded-full h-8"
                        onClick={() => toggleFilter(cuisine, cuisineFilters, setCuisineFilters)}
                      >
                        {cuisine}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Cooking Method */}
                <div className="space-y-3">
                  <h3 className="font-medium text-sm text-gray-500">Cooking Method</h3>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={cookingMethodFilters.length === 0 ? "default" : "outline"}
                      size="sm"
                      className="rounded-full h-8"
                      onClick={() => setCookingMethodFilters([])}
                    >
                      All
                    </Button>
                    {ALL_COOKING_METHODS.map((method) => (
                      <Button
                        key={method}
                        variant={cookingMethodFilters.includes(method) ? "default" : "outline"}
                        size="sm"
                        className="rounded-full h-8"
                        onClick={() => toggleFilter(method, cookingMethodFilters, setCookingMethodFilters)}
                      >
                        {method}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-6">
          {filteredRecipes?.map((recipe, index) => (
            <div key={recipe.id} className="relative group">
              <Card 
                style={{
                  borderRadius: '24px',
                  overflow: 'hidden',
                  position: 'relative',
                  transition: 'all 2500ms cubic-bezier(0.19, 1, 0.22, 1)',
                  transform: `scale(${selectedRecipes.includes(recipe.id) ? '0.98' : '1'})`,
                  transformOrigin: 'center'
                }}
                className={`
                  cursor-pointer 
                  shadow-sm
                  hover:shadow-lg
                  h-[280px] sm:h-[300px] md:h-[320px]
                  rounded-[24px]
                  transform-gpu
                  ${selectedRecipes.includes(recipe.id) 
                    ? 'ring-2 ring-primary ring-offset-2 ring-offset-background bg-primary/5' 
                    : 'hover:scale-[1.02] transition-all duration-2500'
                  }
                  group
                `}
                onClick={(e) => handleCardClick(recipe.id, e)}
              >
                <div className="absolute inset-0 rounded-[24px] overflow-hidden">
                  {recipe.image_url ? (
                    <>
                      <img
                        src={recipe.image_url}
                        alt={recipe.title}
                        className={`
                          absolute inset-0 w-full h-full object-cover
                          transition-all duration-2500
                          group-hover:scale-[1.04]
                          ${selectedRecipes.includes(recipe.id) ? 'brightness-95' : ''}
                        `}
                        style={{
                          transitionTimingFunction: 'cubic-bezier(0.19, 1, 0.22, 1)'
                        }}
                      />
                      {isSelectionMode && (
                        <div className="absolute top-3 left-3 bg-white/30 backdrop-blur-md p-1.5 rounded-full flex items-center justify-center shadow-lg border border-white/30 z-10 transition-opacity duration-200">
                          <div className={cn(
                            "h-5 w-5 rounded-full border-2 transition-colors duration-200",
                            selectedRecipes.includes(recipe.id)
                              ? "bg-primary border-transparent"
                              : "border-white/80 bg-white/20"
                          )}>
                            {selectedRecipes.includes(recipe.id) && (
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="white"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-full w-full p-1"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </div>
                        </div>
                      )}
                      {recipe.cook_time && (
                        <div className="absolute top-3 right-3 bg-white/30 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg border border-white/30 z-10">
                          <Clock className="w-4 h-4 text-white" />
                          <span className="text-sm font-medium text-white drop-shadow-sm">{recipe.cook_time} min</span>
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 h-[50%]">
                        <div 
                          className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
                        />
                        <div 
                          className="absolute inset-0 backdrop-blur-[5px]"
                          style={{ 
                            maskImage: 'linear-gradient(to top, black 60%, transparent)',
                            WebkitMaskImage: 'linear-gradient(to top, black 60%, transparent)'
                          }}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 bg-gray-100" />
                  )}
                </div>
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <h3 className="font-semibold text-lg sm:text-xl line-clamp-2 text-white">
                    {recipe.title}
                  </h3>
                  {recipe.description && (
                    <p className="mt-2 text-sm line-clamp-2 text-white/80">
                      {recipe.description}
                    </p>
                  )}
                </div>
              </Card>
            </div>
          ))}
        </div>

        {filteredRecipes?.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No recipes found</h3>
            <p className="mt-2 text-gray-600">
              Get started by creating a new recipe
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
