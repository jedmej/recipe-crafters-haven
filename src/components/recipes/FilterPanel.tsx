
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from "@/components/ui/slider";
import { SectionDivider } from '@/features/recipes/components/Inspire/components/SectionDivider';

export interface FilterPanelProps {
  mealTypeFilters: string[];
  dietaryFilters: string[];
  difficultyFilters: string[];
  cuisineFilters: string[];
  cookingMethodFilters: string[];
  onFilterChange?: (category: string, value: string) => void;
  selectedFilters?: Record<string, string[]>;
  
  // New props to match RecipeGrid usage
  cookTimeRange?: number[];
  caloriesRange?: number[];
  formatTime?: (minutes: number) => string;
  formatCalories?: (cal: number) => string;
  toggleFilter?: (category: string, value: string, currentFilters: string[], setFilters: (filters: string[]) => void) => void;
  
  // State setters
  setMealTypeFilters?: React.Dispatch<React.SetStateAction<string[]>>;
  setDietaryFilters?: React.Dispatch<React.SetStateAction<string[]>>;
  setDifficultyFilters?: React.Dispatch<React.SetStateAction<string[]>>;
  setCuisineFilters?: React.Dispatch<React.SetStateAction<string[]>>;
  setCookingMethodFilters?: React.Dispatch<React.SetStateAction<string[]>>;
  setCookTimeRange?: React.Dispatch<React.SetStateAction<number[]>>;
  setCaloriesRange?: React.Dispatch<React.SetStateAction<number[]>>;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  mealTypeFilters = [],
  dietaryFilters = [],
  difficultyFilters = [],
  cuisineFilters = [],
  cookingMethodFilters = [],
  onFilterChange,
  selectedFilters = {},
  
  // Added new props with defaults
  cookTimeRange = [0, 180],
  caloriesRange = [0, 2000],
  formatTime = (minutes) => `${minutes}m`,
  formatCalories = (cal) => `${cal} cal`,
  toggleFilter,
  
  // State setters
  setMealTypeFilters,
  setDietaryFilters,
  setDifficultyFilters,
  setCuisineFilters,
  setCookingMethodFilters,
  setCookTimeRange,
  setCaloriesRange,
}) => {
  // Filter categories with common options
  const filterCategories = [
    {
      title: 'Meal Type',
      key: 'meal_type',
      options: ['breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'appetizer'],
      selected: mealTypeFilters,
      setSelected: setMealTypeFilters
    },
    {
      title: 'Dietary',
      key: 'dietary_restrictions',
      options: ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'low-carb'],
      selected: dietaryFilters,
      setSelected: setDietaryFilters
    },
    {
      title: 'Difficulty',
      key: 'difficulty_level',
      options: ['easy', 'medium', 'hard'],
      selected: difficultyFilters,
      setSelected: setDifficultyFilters
    },
    {
      title: 'Cuisine',
      key: 'cuisine_type',
      options: ['Italian', 'Mexican', 'Chinese', 'Japanese', 'Indian', 'American', 'Mediterranean'],
      selected: cuisineFilters,
      setSelected: setCuisineFilters
    },
    {
      title: 'Cooking Method',
      key: 'cooking_method',
      options: ['baking', 'frying', 'grilling', 'roasting', 'steaming', 'boiling'],
      selected: cookingMethodFilters,
      setSelected: setCookingMethodFilters
    }
  ];

  // Handling filter changes
  const handleFilterClick = (category: string, value: string, currentFilters: string[], setFilters?: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (onFilterChange) {
      onFilterChange(category, value);
    } else if (toggleFilter && setFilters) {
      toggleFilter(value, currentFilters, setFilters);
    } else if (setFilters) {
      // Default behavior if toggleFilter is not provided
      setFilters(prev => 
        prev.includes(value)
          ? prev.filter(filter => filter !== value)
          : [...prev, value]
      );
    }
  };

  return (
    <Card className="bg-white shadow-sm">
      <CardContent className="p-4">
        <div className="space-y-6">
          {/* Render filter categories */}
          {filterCategories.map((category) => (
            <div key={category.key} className="space-y-3">
              <SectionDivider title={category.title} />
              <div className="flex flex-wrap gap-2">
                {category.options.map((option) => {
                  const isSelected = category.selected.includes(option);
                  return (
                    <Badge
                      key={option}
                      variant={isSelected ? "default" : "outline"}
                      className={`cursor-pointer ${isSelected ? '' : 'bg-transparent'}`}
                      onClick={() => handleFilterClick(category.key, option, category.selected, category.setSelected)}
                    >
                      {option}
                    </Badge>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Time Range Slider */}
          {setCookTimeRange && (
            <div className="space-y-3">
              <SectionDivider title="Cooking Time" />
              <div className="px-2">
                <Slider
                  value={cookTimeRange}
                  onValueChange={(value) => setCookTimeRange(value as number[])}
                  min={0}
                  max={180}
                  step={5}
                  className="mb-6"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0m</span>
                  <span className="font-medium">
                    {formatTime(cookTimeRange[0])} - {formatTime(cookTimeRange[1])}
                  </span>
                  <span>180m</span>
                </div>
              </div>
            </div>
          )}

          {/* Calories Range Slider */}
          {setCaloriesRange && (
            <div className="space-y-3">
              <SectionDivider title="Calories" />
              <div className="px-2">
                <Slider
                  value={caloriesRange}
                  onValueChange={(value) => setCaloriesRange(value as number[])}
                  min={0}
                  max={2000}
                  step={50}
                  className="mb-6"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0 cal</span>
                  <span className="font-medium">
                    {formatCalories(caloriesRange[0])} - {formatCalories(caloriesRange[1])}
                  </span>
                  <span>2000 cal</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
