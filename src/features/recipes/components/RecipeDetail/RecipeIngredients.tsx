import React from 'react';
import { Button } from "@/components/ui/button";
import { ListPlus, Loader2 } from "lucide-react";
import { MeasurementSystem } from "@/lib/types";
import { scaleAndConvertIngredient } from '../../utils/ingredient-parsing';
import { UseMutationResult } from '@tanstack/react-query';

interface RecipeIngredientsProps {
  ingredients: string[];
  scaleFactor: number;
  measurementSystem: MeasurementSystem;
  desiredServings: number | '';
  handleServingsChange: (value: string) => void;
  toggleMeasurementSystem: () => void;
  addToGroceryList: UseMutationResult<any, Error, void, any>;
}

export function RecipeIngredients({
  ingredients,
  scaleFactor,
  measurementSystem,
  desiredServings,
  handleServingsChange,
  toggleMeasurementSystem,
  addToGroceryList
}: RecipeIngredientsProps) {
  return (
    <div className="space-y-6">
      <ul className="list-none space-y-4">
        {ingredients.map((ingredient, index) => (
          <li key={index} className="flex items-center gap-4 text-lg text-gray-700">
            <span className="w-2 h-2 rounded-full bg-gray-500 flex-shrink-0" />
            <span>{scaleAndConvertIngredient(ingredient, scaleFactor, measurementSystem)}</span>
          </li>
        ))}
      </ul>
      
      <Button
        variant="outline"
        className="w-full h-12 text-base font-medium"
        onClick={() => addToGroceryList.mutate()}
        disabled={addToGroceryList.isPending || !addToGroceryList.mutate}
      >
        {addToGroceryList.isPending ? (
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
        ) : (
          <ListPlus className="h-5 w-5 mr-2" />
        )}
        {addToGroceryList.isPending ? 'Adding...' : 'Add to Grocery List'}
      </Button>
    </div>
  );
} 