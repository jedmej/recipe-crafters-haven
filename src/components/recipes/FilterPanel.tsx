import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RECIPE_CATEGORIES } from '@/types/recipe';
import { Slider } from "@/components/ui/slider";

interface FilterPanelProps {
  mealTypeFilters: string[];
  dietaryFilters: string[];
  difficultyFilters: string[];
  cuisineFilters: string[];
  cookingMethodFilters: string[];
  cookTimeRange: number[];
  caloriesRange: number;
  formatTime: (minutes: number) => string;
  formatCalories?: (calories: number) => string;
  activeFilters: string[];
  setMealTypeFilters: (filters: string[]) => void;
  setDietaryFilters: (filters: string[]) => void;
  setDifficultyFilters: (filters: string[]) => void;
  setCuisineFilters: (filters: string[]) => void;
  setCookingMethodFilters: (filters: string[]) => void;
  setCookTimeRange: (range: number[]) => void;
  setCaloriesRange: (calories: number) => void;
  toggleFilter?: (category: string, value: string, currentFilters: string[], setFilters: (filters: string[]) => void) => void;
}

export function FilterPanel({
  mealTypeFilters,
  dietaryFilters,
  difficultyFilters,
  cuisineFilters,
  cookingMethodFilters,
  cookTimeRange,
  caloriesRange,
  formatTime,
  formatCalories = (cal) => `${cal} kcal`,
  activeFilters,
  setMealTypeFilters,
  setDietaryFilters,
  setDifficultyFilters,
  setCuisineFilters,
  setCookingMethodFilters,
  setCookTimeRange,
  setCaloriesRange,
  toggleFilter
}: FilterPanelProps) {
  // Refs to keep track of the last clicked filter group
  const lastClickedGroupRef = useRef<string | null>(null);

  // Helper function to handle filter toggle
  const handleToggleFilter = (category: string, value: string, currentFilters: string[], setFilters: (filters: string[]) => void) => {
    if (toggleFilter) {
      toggleFilter(category, value, currentFilters, setFilters);
    } else {
      if (currentFilters.includes(value)) {
        setFilters(currentFilters.filter((filter) => filter !== value));
      } else {
        setFilters([...currentFilters, value]);
      }
    }
    lastClickedGroupRef.current = category;
  };

  return (
    <Card className="p-6 shadow-sm w-full">
      <div className="mb-4">
        <h3 className="font-medium text-lg mb-2">Filters</h3>
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filter) => (
            <Badge
              key={filter}
              variant="outline"
              className="px-2 py-1 hover:bg-muted"
            >
              {filter}
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {/* Meal Type */}
        <div>
          <h4 className="font-medium mb-2">Meal Type</h4>
          <div className="flex flex-wrap gap-2">
            {RECIPE_CATEGORIES.meal_type.map((type) => (
              <Button
                key={type}
                size="sm"
                variant={mealTypeFilters.includes(type) ? "default" : "outline"}
                onClick={() =>
                  handleToggleFilter("meal_type", type, mealTypeFilters, setMealTypeFilters)
                }
                className="capitalize"
              >
                {type}
              </Button>
            ))}
          </div>
        </div>

        {/* Dietary Restrictions */}
        <div>
          <h4 className="font-medium mb-2">Dietary Restrictions</h4>
          <div className="flex flex-wrap gap-2">
            {RECIPE_CATEGORIES.dietary_restrictions.map((restriction) => (
              <Button
                key={restriction}
                size="sm"
                variant={dietaryFilters.includes(restriction) ? "default" : "outline"}
                onClick={() =>
                  handleToggleFilter(
                    "dietary_restrictions",
                    restriction,
                    dietaryFilters,
                    setDietaryFilters
                  )
                }
                className="capitalize"
              >
                {restriction}
              </Button>
            ))}
          </div>
        </div>

        {/* Difficulty Level */}
        <div>
          <h4 className="font-medium mb-2">Difficulty Level</h4>
          <div className="flex flex-wrap gap-2">
            {RECIPE_CATEGORIES.difficulty_level.map((level) => (
              <Button
                key={level}
                size="sm"
                variant={difficultyFilters.includes(level) ? "default" : "outline"}
                onClick={() =>
                  handleToggleFilter(
                    "difficulty_level",
                    level,
                    difficultyFilters,
                    setDifficultyFilters
                  )
                }
                className="capitalize"
              >
                {level}
              </Button>
            ))}
          </div>
        </div>

        {/* Cooking Method */}
        <div>
          <h4 className="font-medium mb-2">Cooking Method</h4>
          <div className="flex flex-wrap gap-2">
            {RECIPE_CATEGORIES.cooking_method.map((method) => (
              <Button
                key={method}
                size="sm"
                variant={cookingMethodFilters.includes(method) ? "default" : "outline"}
                onClick={() =>
                  handleToggleFilter(
                    "cooking_method",
                    method,
                    cookingMethodFilters,
                    setCookingMethodFilters
                  )
                }
                className="capitalize"
              >
                {method}
              </Button>
            ))}
          </div>
        </div>

        {/* Cuisine Type */}
        <div>
          <h4 className="font-medium mb-2">Cuisine Type</h4>
          <div className="flex flex-wrap gap-2">
            {RECIPE_CATEGORIES.cuisine_type.map((cuisine) => (
              <Button
                key={cuisine}
                size="sm"
                variant={cuisineFilters.includes(cuisine) ? "default" : "outline"}
                onClick={() =>
                  handleToggleFilter(
                    "cuisine_type",
                    cuisine,
                    cuisineFilters,
                    setCuisineFilters
                  )
                }
              >
                {cuisine}
              </Button>
            ))}
          </div>
        </div>

        {/* Cooking Time */}
        <div>
          <div className="flex justify-between mb-2">
            <h4 className="font-medium">Total Cooking Time</h4>
            <span className="text-sm text-muted-foreground">
              {formatTime(cookTimeRange[0])} - {formatTime(cookTimeRange[1])}
            </span>
          </div>
          <Slider
            min={0}
            max={300}
            step={5}
            value={cookTimeRange}
            onValueChange={(value) => setCookTimeRange(value as number[])}
            className="my-6"
          />
        </div>

        {/* Calories */}
        <div>
          <div className="flex justify-between mb-2">
            <h4 className="font-medium">Maximum Calories</h4>
            <span className="text-sm text-muted-foreground">{formatCalories(caloriesRange)}</span>
          </div>
          <Slider
            min={0}
            max={2000}
            step={50}
            value={[caloriesRange]}
            onValueChange={(value) => setCaloriesRange(value[0])}
            className="my-6"
          />
        </div>
      </div>
    </Card>
  );
}
