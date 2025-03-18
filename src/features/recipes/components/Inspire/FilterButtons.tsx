import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

interface FilterButtonsProps {
  category: string;
  title: string;
  options: string[];
  selectedFilters: string[];
  toggleFilter: (category: string, option: string) => void;
  isGenerating: boolean;
  customValues: Record<string, string>;
  setCustomValue: (category: string, value: string) => void;
  dynamicCategories: Record<string, string[]>;
}

export const FilterButtons: React.FC<FilterButtonsProps> = ({
  category,
  title,
  options,
  selectedFilters,
  toggleFilter,
  isGenerating,
  customValues,
  setCustomValue,
  dynamicCategories,
}) => {
  const { t } = useTranslation('recipes');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customValue, setCustomValueLocal] = useState('');

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customValue.trim()) {
      setCustomValue(category, customValue.trim());
      toggleFilter(category, 'Other');
      setCustomValueLocal('');
      setShowCustomInput(false);
    }
  };

  const getTranslatedOption = (option: string) => {
    // Special handling for meal types since they have a different format
    if (category === 'mealType') {
      // Convert "Side Dish" to "sideDish", "Breakfast" to "breakfast", etc.
      const key = option.split(' ').map((word, index) => 
        index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1)
      ).join('');
      return t(`filters.mealTypes.${key}`, option);
    }
    // Special handling for health focus types
    if (category === 'healthFocus') {
      // Convert "Low-Calorie" to "lowCalorie", "High-Protein" to "highProtein", etc.
      const key = option.split(/[-\s]/).map((word, index) => 
        index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1)
      ).join('');
      return t(`filters.healthFocusTypes.${key}`, option);
    }
    // Special handling for dietary restrictions
    if (category === 'dietaryRestrictions') {
      // Convert "Gluten-free" to "glutenFree", "Dairy-free" to "dairyFree", etc.
      const key = option.split(/[-\s]/).map((word, index) => 
        index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1)
      ).join('');
      return t(`filters.dietaryTypes.${key}`, option);
    }
    // Special handling for difficulty levels
    if (category === 'difficultyLevel') {
      // Convert "Easy" to "easy", "Medium" to "medium", etc.
      return t(`filters.difficultyLevels.${option.toLowerCase()}`, option);
    }
    // Special handling for cuisine types
    if (category === 'cuisineType') {
      const key = option.split(/[-\s]/).map((word, index) => 
        index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1)
      ).join('');
      return t(`filters.cuisineTypes.${key}`, option);
    }
    // Special handling for cooking methods
    if (category === 'cookingMethod') {
      // Convert "Slow Cooking" to "slowCooking", "Sous Vide" to "sousVide", etc.
      const key = option.split(/[-\s]/).map((word, index) => 
        index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1)
      ).join('');
      return t(`filters.cookingMethods.${key}`, option);
    }
    return t(`filters.${category}Types.${option.toLowerCase().replace(/\s+/g, '')}`, option);
  };

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-gray-700">{t(`filters.${category}`)}</h4>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selectedFilters.includes(option);
          const displayValue = option === 'Other' && isSelected ? customValues[category] : getTranslatedOption(option);

          return (
            <Button
              key={option}
              type="button"
              variant={isSelected ? "default" : "outline"}
              className={`rounded-full px-4 py-2 h-auto ${
                isSelected ? 'bg-[#FA8923] hover:bg-[#FA8923]/90 text-white' : 'hover:bg-gray-100'
              }`}
              onClick={() => {
                if (option === 'Other' && !isSelected) {
                  setShowCustomInput(true);
                } else {
                  toggleFilter(category, option);
                }
              }}
              disabled={isGenerating}
            >
              {displayValue}
              {isSelected && (
                <X className="ml-2 h-3 w-3" />
              )}
            </Button>
          );
        })}
      </div>

      {showCustomInput && (
        <form onSubmit={handleCustomSubmit} className="mt-2 flex gap-2">
          <Input
            type="text"
            value={customValue}
            onChange={(e) => setCustomValueLocal(e.target.value)}
            placeholder={t('filters.customOption')}
            className="flex-1"
            disabled={isGenerating}
          />
          <Button
            type="submit"
            variant="outline"
            disabled={!customValue.trim() || isGenerating}
          >
            {t('actions.add')}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowCustomInput(false)}
            disabled={isGenerating}
          >
            {t('actions.cancel')}
          </Button>
        </form>
      )}
    </div>
  );
};