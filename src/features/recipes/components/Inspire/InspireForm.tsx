
import React from 'react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { TimeSlider } from './components/TimeSlider';
import { SectionDivider } from './components/SectionDivider';
import { FilterButtons } from './FilterButtons';
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { RECIPE_CATEGORIES } from '@/types/recipe';
import { Clock, Flame } from 'lucide-react';

type InspireFormProps = {
  query: string;
  setQuery: (value: string) => void;
  excludeIngredients: string;
  setExcludeIngredients: (value: string) => void;
  maxPrepTime: number;
  setMaxPrepTime: (value: number) => void;
  maxCalories: number;
  setMaxCalories: (value: number) => void;
  includeGeneratedImage: boolean;
  setIncludeGeneratedImage: (value: boolean) => void;
  selectedFilters: Record<string, string[]>;
  toggleFilter: (category: string, option: string) => void;
  customValues: Record<string, string>;
  setCustomValue: (category: string, value: string) => void;
  isGenerating: boolean;
  isExpanded: boolean;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  handleToggleExpand: () => void;
  dynamicCategories: Record<string, string[]>;
};

export const InspireForm: React.FC<InspireFormProps> = ({
  query,
  setQuery,
  excludeIngredients,
  setExcludeIngredients,
  maxPrepTime,
  setMaxPrepTime,
  maxCalories,
  setMaxCalories,
  includeGeneratedImage,
  setIncludeGeneratedImage,
  selectedFilters,
  toggleFilter,
  customValues,
  setCustomValue,
  isGenerating,
  isExpanded,
  handleSubmit,
  handleToggleExpand,
  dynamicCategories,
}) => {
  // Convert Record<string, string[]> to string[] for proper type compatibility
  const convertSelectedFilters = (category: string): string[] => {
    const filters = selectedFilters[category];
    return Array.isArray(filters) ? filters : [];
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Input 
          placeholder="Describe what kind of recipe you want, e.g. 'a healthy vegetarian dinner'"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-full h-12 text-lg"
        />
      </div>

      {isExpanded && (
        <>
          <SectionDivider title="Include & Exclude" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Ingredients to Exclude</label>
              <Textarea 
                placeholder="Enter ingredients you don't want, separated by commas"
                value={excludeIngredients}
                onChange={(e) => setExcludeIngredients(e.target.value)}
                className="h-20"
              />
            </div>
          </div>

          <SectionDivider title="Recipe Details" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <TimeSlider 
                value={maxPrepTime} 
                setValue={setMaxPrepTime}
                title="Max Preparation Time"
                icon={<Clock className="mr-2 h-4 w-4" />}
                unit="minutes"
                max={180}
              />
            </div>
            <div>
              <TimeSlider 
                value={maxCalories} 
                setValue={setMaxCalories}
                title="Max Calories (per serving)"
                icon={<Flame className="mr-2 h-4 w-4" />}
                unit="kcal"
                max={2000}
                step={50}
              />
            </div>
          </div>

          <SectionDivider title="Categories" />

          <div className="space-y-6">
            <FilterButtons
              category="meal_type"
              title="Meal Type"
              options={dynamicCategories.meal_type || RECIPE_CATEGORIES.meal_type}
              selectedFilters={convertSelectedFilters('meal_type')}
              toggleFilter={toggleFilter}
              isGenerating={isGenerating}
              customValues={customValues}
              setCustomValue={setCustomValue}
              dynamicCategories={dynamicCategories}
            />
            
            <FilterButtons
              category="dietary_restrictions"
              title="Dietary Restrictions"
              options={dynamicCategories.dietary_restrictions || RECIPE_CATEGORIES.dietary_restrictions}
              selectedFilters={convertSelectedFilters('dietary_restrictions')}
              toggleFilter={toggleFilter}
              isGenerating={isGenerating}
              customValues={customValues}
              setCustomValue={setCustomValue}
              dynamicCategories={dynamicCategories}
            />
            
            <FilterButtons
              category="difficulty_level"
              title="Difficulty Level"
              options={dynamicCategories.difficulty_level || RECIPE_CATEGORIES.difficulty_level}
              selectedFilters={convertSelectedFilters('difficulty_level')}
              toggleFilter={toggleFilter}
              isGenerating={isGenerating}
              customValues={customValues}
              setCustomValue={setCustomValue}
              dynamicCategories={dynamicCategories}
            />
            
            <FilterButtons
              category="cuisine_type"
              title="Cuisine Type"
              options={dynamicCategories.cuisine_type || RECIPE_CATEGORIES.cuisine_type}
              selectedFilters={convertSelectedFilters('cuisine_type')}
              toggleFilter={toggleFilter}
              isGenerating={isGenerating}
              customValues={customValues}
              setCustomValue={setCustomValue}
              dynamicCategories={dynamicCategories}
            />
            
            <FilterButtons
              category="cooking_method"
              title="Cooking Method"
              options={dynamicCategories.cooking_method || RECIPE_CATEGORIES.cooking_method}
              selectedFilters={convertSelectedFilters('cooking_method')}
              toggleFilter={toggleFilter}
              isGenerating={isGenerating}
              customValues={customValues}
              setCustomValue={setCustomValue}
              dynamicCategories={dynamicCategories}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="includeGeneratedImage"
              checked={includeGeneratedImage}
              onCheckedChange={setIncludeGeneratedImage}
            />
            <label htmlFor="includeGeneratedImage" className="text-sm font-medium text-gray-700">
              Generate recipe image
            </label>
          </div>
        </>
      )}

      <div className="flex justify-between">
        <Button 
          type="button" 
          variant="outline" 
          onClick={handleToggleExpand} 
          className="rounded-full"
        >
          {isExpanded ? "Fewer options" : "More options"}
        </Button>
        <Button 
          type="submit" 
          disabled={isGenerating || !query.trim()} 
          className="rounded-full"
        >
          {isGenerating ? <LoadingSpinner /> : "Generate Recipe"}
        </Button>
      </div>
    </form>
  );
};
