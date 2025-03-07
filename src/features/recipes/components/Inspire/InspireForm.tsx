import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { TimeSlider } from './components/TimeSlider';
import { FilterButtons } from './FilterButtons';
import { FILTER_CATEGORIES } from "@/features/recipes/utils/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilterState {
  mealType: string[];
  dietaryRestrictions: string[];
  difficultyLevel: string[];
  cuisineType: string[];
  cookingMethod: string[];
  occasion: string[];
  courseCategory: string[];
  tasteProfile: string[];
  customValues: Record<string, string>;
  dynamicCategories: Record<string, string[]>;
}

interface InspireFormProps {
  useIngredients: boolean;
  setUseIngredients: (use: boolean) => void;
  ingredients: string;
  setIngredients: (ingredients: string) => void;
  cookingTime: number;
  setCookingTime: (time: number) => void;
  filters: FilterState;
  toggleFilter: (category: string, option: string) => void;
  setCustomValue: (category: string, value: string) => void;
  isGenerating: boolean;
  handleGenerateRecipe: (e: React.FormEvent) => void;
}

export const InspireForm: React.FC<InspireFormProps> = ({
  useIngredients,
  setUseIngredients,
  ingredients,
  setIngredients,
  cookingTime,
  setCookingTime,
  filters,
  toggleFilter,
  setCustomValue,
  isGenerating,
  handleGenerateRecipe,
}) => (
  <Card className="overflow-hidden rounded-[48px] mb-8 bg-[#F5F5F5] border-none">
    <CardContent className="p-6">
      <h1 className="text-3xl font-bold mb-6">Get Inspired with AI</h1>
      
      <form onSubmit={handleGenerateRecipe} className="space-y-8">
        {/* Ingredients section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Switch 
              id="use-ingredients" 
              checked={useIngredients} 
              onCheckedChange={setUseIngredients}
            />
            <Label htmlFor="use-ingredients" className="font-medium">Use ingredients</Label>
          </div>
          
          {useIngredients && (
            <div className="space-y-2">
              <Label htmlFor="ingredients">Ingredients (comma separated)</Label>
              <Input
                id="ingredients"
                placeholder="e.g., chicken, rice, tomatoes, olive oil"
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                disabled={isGenerating}
              />
              <p className="text-sm text-muted-foreground">
                Add ingredients you want to use in your recipe
              </p>
            </div>
          )}
        </div>
        
        {/* Cooking time slider */}
        <TimeSlider
          cookingTime={cookingTime}
          setCookingTime={setCookingTime}
          isGenerating={isGenerating}
        />
        
        {/* Filters section */}
        <div className="space-y-4">
          <h3 className="font-medium">Filters</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(FILTER_CATEGORIES).map(([category, { title, options }]) => (
              <FilterButtons
                key={category}
                category={category}
                title={title}
                options={options}
                selectedFilters={filters[category as keyof FilterState]}
                toggleFilter={toggleFilter}
                isGenerating={isGenerating}
                customValues={filters.customValues}
                setCustomValue={setCustomValue}
                dynamicCategories={filters.dynamicCategories}
              />
            ))}
          </div>
        </div>
        
        {/* Submit button */}
        <Button
          type="submit"
          disabled={isGenerating}
          className="w-full rounded-[500px] bg-[#FA8923] hover:bg-[#FA8923]/90 text-white h-12"
          variant="primary"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Recipe...
            </>
          ) : (
            "Generate Recipe"
          )}
        </Button>
      </form>
    </CardContent>
  </Card>
);