import { useState } from 'react';
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  RecipeFilters as RecipeFiltersType,
  CookingTime,
  MealType,
  DietaryRestriction,
  DifficultyLevel,
  CuisineType,
  CookingMethod,
  DEFAULT_COOKING_TIME,
  ALL_MEAL_TYPES,
  ALL_DIETARY_RESTRICTIONS,
  ALL_DIFFICULTY_LEVELS,
  ALL_CUISINE_TYPES,
  ALL_COOKING_METHODS,
} from '@/types/filters';

interface RecipeFiltersProps {
  filters: RecipeFiltersType;
  onChange: (filters: RecipeFiltersType) => void;
  onCustomInput?: (category: string, value: string) => void;
  showCustomInputs?: boolean;
  className?: string;
}

export function RecipeFilters({ filters, onChange, onCustomInput, showCustomInputs = false, className }: RecipeFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});

  const handleCookingTimeChange = (value: number[]) => {
    onChange({
      ...filters,
      cookingTime: { min: value[0], max: value[1] }
    });
  };

  const toggleMealType = (type: MealType) => {
    const currentTypes = filters.mealTypes || [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type];
    onChange({ ...filters, mealTypes: newTypes });
  };

  const toggleDietaryRestriction = (restriction: DietaryRestriction) => {
    const current = filters.dietaryRestrictions || [];
    const newRestrictions = current.includes(restriction)
      ? current.filter(r => r !== restriction)
      : [...current, restriction];
    onChange({ ...filters, dietaryRestrictions: newRestrictions });
  };

  const toggleCuisineType = (cuisine: CuisineType) => {
    const current = filters.cuisineTypes || [];
    const newCuisines = current.includes(cuisine)
      ? current.filter(c => c !== cuisine)
      : [...current, cuisine];
    onChange({ ...filters, cuisineTypes: newCuisines });

    // Handle custom input for "Other" cuisine
    if (cuisine === 'Other' && !current.includes('Other')) {
      setCustomInputs(prev => ({ ...prev, cuisineType: '' }));
    } else if (cuisine === 'Other') {
      const newCustomInputs = { ...customInputs };
      delete newCustomInputs.cuisineType;
      setCustomInputs(newCustomInputs);
    }
  };

  const toggleCookingMethod = (method: CookingMethod) => {
    const current = filters.cookingMethods || [];
    const newMethods = current.includes(method)
      ? current.filter(m => m !== method)
      : [...current, method];
    onChange({ ...filters, cookingMethods: newMethods });

    // Handle custom input for "Other" method
    if (method === 'Other' && !current.includes('Other')) {
      setCustomInputs(prev => ({ ...prev, cookingMethod: '' }));
    } else if (method === 'Other') {
      const newCustomInputs = { ...customInputs };
      delete newCustomInputs.cookingMethod;
      setCustomInputs(newCustomInputs);
    }
  };

  const handleDifficultyChange = (value: string) => {
    onChange({
      ...filters,
      difficultyLevel: value as DifficultyLevel
    });
  };

  const handleCustomInputChange = (category: string, value: string) => {
    setCustomInputs(prev => ({ ...prev, [category]: value }));
    if (onCustomInput) {
      onCustomInput(category, value);
    }
  };

  const clearFilters = () => {
    onChange({
      cookingTime: DEFAULT_COOKING_TIME,
      mealTypes: [],
      dietaryRestrictions: [],
      difficultyLevel: undefined,
      cuisineTypes: [],
      cookingMethods: []
    });
    setCustomInputs({});
    setIsOpen(false);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.mealTypes?.length) count++;
    if (filters.dietaryRestrictions?.length) count++;
    if (filters.difficultyLevel) count++;
    if (filters.cuisineTypes?.length) count++;
    if (filters.cookingMethods?.length) count++;
    if (filters.cookingTime && 
        (filters.cookingTime.min !== DEFAULT_COOKING_TIME.min || 
         filters.cookingTime.max !== DEFAULT_COOKING_TIME.max)) count++;
    return count;
  };

  return (
    <div className={className}>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary" className="ml-1">
                {getActiveFiltersCount()}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Recipe Filters</SheetTitle>
          </SheetHeader>
          
          <div className="py-6 space-y-6">
            {/* Cooking Time Slider */}
            <div className="space-y-4">
              <Label>Cooking Time (minutes)</Label>
              <Slider
                defaultValue={[
                  filters.cookingTime?.min || DEFAULT_COOKING_TIME.min,
                  filters.cookingTime?.max || DEFAULT_COOKING_TIME.max
                ]}
                max={120}
                min={5}
                step={5}
                onValueChange={handleCookingTimeChange}
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{filters.cookingTime?.min || DEFAULT_COOKING_TIME.min}m</span>
                <span>{filters.cookingTime?.max || DEFAULT_COOKING_TIME.max}m</span>
              </div>
            </div>

            {/* Meal Types */}
            <div className="space-y-4">
              <Label>Meal Type</Label>
              <div className="flex flex-wrap gap-2">
                {ALL_MEAL_TYPES.map((type) => (
                  <Badge
                    key={type}
                    variant={filters.mealTypes?.includes(type) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleMealType(type)}
                  >
                    {type}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Dietary Restrictions */}
            <div className="space-y-4">
              <Label>Dietary Restrictions</Label>
              <div className="flex flex-wrap gap-2">
                {ALL_DIETARY_RESTRICTIONS.map((restriction) => (
                  <Badge
                    key={restriction}
                    variant={filters.dietaryRestrictions?.includes(restriction) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleDietaryRestriction(restriction)}
                  >
                    {restriction}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Difficulty Level */}
            <div className="space-y-4">
              <Label>Difficulty Level</Label>
              <RadioGroup
                value={filters.difficultyLevel}
                onValueChange={handleDifficultyChange}
                className="flex gap-4"
              >
                {ALL_DIFFICULTY_LEVELS.map((level) => (
                  <div key={level} className="flex items-center space-x-2">
                    <RadioGroupItem value={level} id={level} />
                    <Label htmlFor={level}>{level}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Cuisine Types */}
            <div className="space-y-4">
              <Label>Cuisine Type</Label>
              <div className="flex flex-wrap gap-2">
                {ALL_CUISINE_TYPES.map((cuisine) => (
                  <Badge
                    key={cuisine}
                    variant={filters.cuisineTypes?.includes(cuisine) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleCuisineType(cuisine)}
                  >
                    {cuisine}
                  </Badge>
                ))}
              </div>
              {showCustomInputs && filters.cuisineTypes?.includes('Other') && (
                <Input
                  placeholder="Enter custom cuisine type..."
                  value={customInputs.cuisineType || ''}
                  onChange={(e) => handleCustomInputChange('cuisineType', e.target.value)}
                  className="mt-2"
                />
              )}
            </div>

            {/* Cooking Methods */}
            <div className="space-y-4">
              <Label>Cooking Method</Label>
              <div className="flex flex-wrap gap-2">
                {ALL_COOKING_METHODS.map((method) => (
                  <Badge
                    key={method}
                    variant={filters.cookingMethods?.includes(method) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleCookingMethod(method)}
                  >
                    {method}
                  </Badge>
                ))}
              </div>
              {showCustomInputs && filters.cookingMethods?.includes('Other') && (
                <Input
                  placeholder="Enter custom cooking method..."
                  value={customInputs.cookingMethod || ''}
                  onChange={(e) => handleCustomInputChange('cookingMethod', e.target.value)}
                  className="mt-2"
                />
              )}
            </div>

            {/* Clear Filters Button */}
            <Button
              variant="outline"
              className="w-full"
              onClick={clearFilters}
            >
              Clear All Filters
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
} 