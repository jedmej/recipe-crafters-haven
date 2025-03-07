import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FilterSelectionGroupProps {
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

export const FilterSelectionGroup: React.FC<FilterSelectionGroupProps> = ({
  category,
  title,
  options,
  selectedFilters,
  toggleFilter,
  isGenerating,
  customValues,
  setCustomValue,
  dynamicCategories
}) => {
  const isOtherSelected = selectedFilters.includes("Other");
  
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{title}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => toggleFilter(category, option)}
            className={`px-4 py-2 rounded-full text-sm ${
              selectedFilters.includes(option)
                ? "bg-[#FA8923] text-white"
                : "bg-white text-gray-700 hover:bg-white/90"
            }`}
            disabled={isGenerating}
          >
            {option}
          </button>
        ))}
      </div>
      
      {isOtherSelected && (
        <div className="mt-2">
          <Input
            placeholder={`Enter custom ${title.toLowerCase()}`}
            value={customValues[category] || ''}
            onChange={(e) => setCustomValue(category, e.target.value)}
            disabled={isGenerating}
            className="text-sm"
            list={`${category}-suggestions`}
          />
          {/* Add datalist for suggestions from dynamic categories */}
          <datalist id={`${category}-suggestions`}>
            {dynamicCategories[category]?.map((suggestion, idx) => (
              <option key={idx} value={suggestion} />
            ))}
          </datalist>
        </div>
      )}
    </div>
  );
};