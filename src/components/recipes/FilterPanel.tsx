
import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { SlidersHorizontal, Check, X, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";

export interface FilterPanelProps {
  mealTypeFilters: string[];
  dietaryFilters: string[];
  difficultyFilters: string[];
  cuisineFilters: string[];
  cookingMethodFilters: string[];
  cookTimeRange: number[];
  caloriesRange: number;
  formatTime: (minutes: number) => string;
  activeFilters: string[];
  setMealTypeFilters: (filters: string[]) => void;
  setDietaryFilters: (filters: string[]) => void;
  setDifficultyFilters: (filters: string[]) => void;
  setCuisineFilters: (filters: string[]) => void;
  setCookingMethodFilters: (filters: string[]) => void;
  setCookTimeRange: (range: number[]) => void;
  setCaloriesRange: (calories: number) => void;
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
  activeFilters,
  setMealTypeFilters,
  setDietaryFilters,
  setDifficultyFilters,
  setCuisineFilters,
  setCookingMethodFilters,
  setCookTimeRange,
  setCaloriesRange,
}: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleFilter = (category: string, value: string, currentFilters: string[], setFilters: (filters: string[]) => void) => {
    if (currentFilters.includes(value)) {
      setFilters(currentFilters.filter((filter) => filter !== value));
    } else {
      setFilters([...currentFilters, value]);
    }
  };

  const clearFilters = () => {
    setMealTypeFilters([]);
    setDietaryFilters([]);
    setDifficultyFilters([]);
    setCuisineFilters([]);
    setCookingMethodFilters([]);
    setCookTimeRange([15, 120]);
    setCaloriesRange(1000);
    setIsOpen(false);
  };

  const renderFilterChips = () => {
    return (
      <div className="flex flex-wrap gap-2 mb-4">
        {activeFilters.length > 0 && (
          <>
            {activeFilters.map((filter) => (
              <Badge key={filter} variant="outline" className="bg-primary/10 text-primary">
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
                <button className="ml-1" onClick={() => removeFilter(filter)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={clearFilters}
            >
              Clear all
            </Button>
          </>
        )}
      </div>
    );
  };

  const removeFilter = (filter: string) => {
    // Check which filter category this belongs to and remove it
    if (mealTypeFilters.includes(filter)) {
      setMealTypeFilters(mealTypeFilters.filter((f) => f !== filter));
    } else if (dietaryFilters.includes(filter)) {
      setDietaryFilters(dietaryFilters.filter((f) => f !== filter));
    } else if (difficultyFilters.includes(filter)) {
      setDifficultyFilters(difficultyFilters.filter((f) => f !== filter));
    } else if (cuisineFilters.includes(filter)) {
      setCuisineFilters(cuisineFilters.filter((f) => f !== filter));
    } else if (cookingMethodFilters.includes(filter)) {
      setCookingMethodFilters(cookingMethodFilters.filter((f) => f !== filter));
    }
  };

  const handleApplyFilters = () => {
    setIsOpen(false);
  };

  return (
    <div>
      {renderFilterChips()}

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFilters.length > 0 && (
              <Badge className="h-5 w-5 p-0 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                {activeFilters.length}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent className="w-[90vw] sm:max-w-md p-0">
          <SheetHeader className="px-6 py-4 border-b">
            <SheetTitle>Filter Recipes</SheetTitle>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-10rem)] p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-3">Meal Type</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    "breakfast",
                    "lunch",
                    "dinner",
                    "dessert",
                    "snack",
                    "appetizer",
                    "side dish",
                  ].map((type) => (
                    <FilterChip
                      key={type}
                      label={type}
                      active={mealTypeFilters.includes(type)}
                      onClick={() =>
                        toggleFilter("meal_type", type, mealTypeFilters, setMealTypeFilters)
                      }
                    />
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-medium mb-3">Dietary Restrictions</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    "vegetarian",
                    "vegan",
                    "gluten-free",
                    "dairy-free",
                    "low-carb",
                    "keto",
                    "paleo",
                  ].map((diet) => (
                    <FilterChip
                      key={diet}
                      label={diet}
                      active={dietaryFilters.includes(diet)}
                      onClick={() =>
                        toggleFilter(
                          "dietary_restrictions",
                          diet,
                          dietaryFilters,
                          setDietaryFilters
                        )
                      }
                    />
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-medium mb-3">Difficulty Level</h3>
                <div className="flex flex-wrap gap-2">
                  {["easy", "medium", "hard"].map((level) => (
                    <FilterChip
                      key={level}
                      label={level}
                      active={difficultyFilters.includes(level)}
                      onClick={() =>
                        toggleFilter(
                          "difficulty_level",
                          level,
                          difficultyFilters,
                          setDifficultyFilters
                        )
                      }
                    />
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-medium mb-3">Cuisine Type</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Italian",
                    "Mexican",
                    "American",
                    "Asian",
                    "Mediterranean",
                    "Indian",
                    "French",
                    "Greek",
                  ].map((cuisine) => (
                    <FilterChip
                      key={cuisine}
                      label={cuisine}
                      active={cuisineFilters.includes(cuisine)}
                      onClick={() =>
                        toggleFilter(
                          "cuisine_type",
                          cuisine,
                          cuisineFilters,
                          setCuisineFilters
                        )
                      }
                    />
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-medium mb-3">Cooking Method</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    "baking",
                    "grilling",
                    "frying",
                    "roasting",
                    "boiling",
                    "slow cooking",
                    "steaming",
                  ].map((method) => (
                    <FilterChip
                      key={method}
                      label={method}
                      active={cookingMethodFilters.includes(method)}
                      onClick={() =>
                        toggleFilter(
                          "cooking_method",
                          method,
                          cookingMethodFilters,
                          setCookingMethodFilters
                        )
                      }
                    />
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium">Cook Time</h3>
                  <div className="text-sm text-muted-foreground">
                    <Timer className="inline h-3.5 w-3.5 mr-1" />
                    {formatTime(cookTimeRange[0])} - {formatTime(cookTimeRange[1])}
                  </div>
                </div>
                <Slider
                  defaultValue={cookTimeRange}
                  value={cookTimeRange}
                  min={5}
                  max={180}
                  step={5}
                  onValueChange={(value) => setCookTimeRange(value as number[])}
                />
              </div>

              <Separator />

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium">Calories</h3>
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">{caloriesRange}</span> kcal or less
                  </div>
                </div>
                <Slider
                  defaultValue={[caloriesRange]}
                  value={[caloriesRange]}
                  min={100}
                  max={2000}
                  step={50}
                  onValueChange={(value) => setCaloriesRange(value[0])}
                />
              </div>
            </div>
          </ScrollArea>

          <SheetFooter className="px-6 py-4 border-t gap-2">
            <Button variant="outline" onClick={clearFilters}>
              Reset
            </Button>
            <Button onClick={handleApplyFilters}>Apply Filters</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

interface FilterChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

const FilterChip: React.FC<FilterChipProps> = ({ label, active, onClick }) => (
  <Button
    variant={active ? "secondary" : "outline"}
    size="sm"
    className="h-8 rounded-full"
    onClick={onClick}
  >
    {active && <Check className="h-3.5 w-3.5 mr-1.5" />}
    {label}
  </Button>
);
