import React from 'react';
import { FilterSelectionGroup } from './components/FilterSelectionGroup';

export interface FilterButtonsProps {
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

export const FilterButtons: React.FC<FilterButtonsProps> = (props) => {
  return <FilterSelectionGroup {...props} />;
};