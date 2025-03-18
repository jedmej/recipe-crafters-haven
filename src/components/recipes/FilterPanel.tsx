import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useTranslation } from "react-i18next";
import {
  ALL_MEAL_TYPES,
  ALL_DIETARY_RESTRICTIONS,
  ALL_DIFFICULTY_LEVELS,
  ALL_CUISINE_TYPES,
  ALL_COOKING_METHODS,
} from "@/types/filters";

interface FilterPanelProps {
  mealTypeFilters: string[];
  dietaryFilters: string[];
  difficultyFilters: string[];
  cuisineFilters: string[];
  cookingMethodFilters: string[];
  cookTimeRange: number[];
  caloriesRange: number[];
  formatTime: (minutes: number) => string;
  formatCalories: (cal: number) => string;
  toggleFilter: (value: string, currentFilters: string[], setFilters: (filters: string[]) => void) => void;
  setMealTypeFilters: (filters: string[]) => void;
  setDietaryFilters: (filters: string[]) => void;
  setDifficultyFilters: (filters: string[]) => void;
  setCuisineFilters: (filters: string[]) => void;
  setCookingMethodFilters: (filters: string[]) => void;
  setCookTimeRange: (range: number[]) => void;
  setCaloriesRange: (range: number[]) => void;
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
  formatCalories,
  toggleFilter,
  setMealTypeFilters,
  setDietaryFilters,
  setDifficultyFilters,
  setCuisineFilters,
  setCookingMethodFilters,
  setCookTimeRange,
  setCaloriesRange,
}: FilterPanelProps) {
  const { t } = useTranslation("recipes");

  return (
    <div className="bg-white shadow-sm rounded-2xl p-6 space-y-6">
      {/* Time Range Slider */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-base text-gray-900">{t("filters.cookTime")}</h3>
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
          <h3 className="font-medium text-base text-gray-900">{t("filters.calories")}</h3>
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
        <h3 className="font-medium text-sm text-gray-500">{t("filters.mealType")}</h3>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={mealTypeFilters.length === 0 ? "default" : "outline"}
            size="sm"
            className="rounded-full h-8"
            onClick={() => setMealTypeFilters([])}
          >
            {t("filters.all")}
          </Button>
          {ALL_MEAL_TYPES.map((type) => (
            <Button
              key={type}
              variant={mealTypeFilters.includes(type) ? "default" : "outline"}
              size="sm"
              className="rounded-full h-8"
              onClick={() => toggleFilter(type, mealTypeFilters, setMealTypeFilters)}
            >
              {t(`filters.mealTypes.${type.toLowerCase()}`)}
            </Button>
          ))}
        </div>
      </div>

      {/* Dietary Restrictions */}
      <div className="space-y-3">
        <h3 className="font-medium text-sm text-gray-500">{t("filters.dietary")}</h3>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={dietaryFilters.length === 0 ? "default" : "outline"}
            size="sm"
            className="rounded-full h-8"
            onClick={() => setDietaryFilters([])}
          >
            {t("filters.all")}
          </Button>
          {ALL_DIETARY_RESTRICTIONS.map((restriction) => (
            <Button
              key={restriction}
              variant={dietaryFilters.includes(restriction) ? "default" : "outline"}
              size="sm"
              className="rounded-full h-8"
              onClick={() => toggleFilter(restriction, dietaryFilters, setDietaryFilters)}
            >
              {t(`filters.dietaryTypes.${restriction.toLowerCase()}`)}
            </Button>
          ))}
        </div>
      </div>

      {/* Difficulty Level */}
      <div className="space-y-3">
        <h3 className="font-medium text-sm text-gray-500">{t("filters.difficulty")}</h3>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={difficultyFilters.length === 0 ? "default" : "outline"}
            size="sm"
            className="rounded-full h-8"
            onClick={() => setDifficultyFilters([])}
          >
            {t("filters.all")}
          </Button>
          {ALL_DIFFICULTY_LEVELS.map((level) => (
            <Button
              key={level}
              variant={difficultyFilters.includes(level) ? "default" : "outline"}
              size="sm"
              className="rounded-full h-8"
              onClick={() => toggleFilter(level, difficultyFilters, setDifficultyFilters)}
            >
              {t(`filters.difficultyLevels.${level.toLowerCase()}`)}
            </Button>
          ))}
        </div>
      </div>

      {/* Cuisine Type */}
      <div className="space-y-3">
        <h3 className="font-medium text-sm text-gray-500">{t("filters.cuisine")}</h3>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={cuisineFilters.length === 0 ? "default" : "outline"}
            size="sm"
            className="rounded-full h-8"
            onClick={() => setCuisineFilters([])}
          >
            {t("filters.all")}
          </Button>
          {ALL_CUISINE_TYPES.map((cuisine) => (
            <Button
              key={cuisine}
              variant={cuisineFilters.includes(cuisine) ? "default" : "outline"}
              size="sm"
              className="rounded-full h-8"
              onClick={() => toggleFilter(cuisine, cuisineFilters, setCuisineFilters)}
            >
              {t(`filters.cuisineTypes.${cuisine.toLowerCase()}`)}
            </Button>
          ))}
        </div>
      </div>

      {/* Cooking Method */}
      <div className="space-y-3">
        <h3 className="font-medium text-sm text-gray-500">{t("filters.cookingMethod")}</h3>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={cookingMethodFilters.length === 0 ? "default" : "outline"}
            size="sm"
            className="rounded-full h-8"
            onClick={() => setCookingMethodFilters([])}
          >
            {t("filters.all")}
          </Button>
          {ALL_COOKING_METHODS.map((method) => (
            <Button
              key={method}
              variant={cookingMethodFilters.includes(method) ? "default" : "outline"}
              size="sm"
              className="rounded-full h-8"
              onClick={() => toggleFilter(method, cookingMethodFilters, setCookingMethodFilters)}
            >
              {t(`filters.cookingMethods.${method.toLowerCase()}`)}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
} 