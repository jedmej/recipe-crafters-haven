import React from 'react';
import { Button } from "@/components/ui/button";
import { ListPlus, Loader2, Plus, Minus } from "lucide-react";
import { MeasurementSystem } from "@/lib/types";
import { scaleAndConvertIngredient } from '../../utils/ingredient-parsing';
import { UseMutationResult } from '@tanstack/react-query';
import { Input } from "@/components/ui/input";

interface RecipeIngredientsProps {
  ingredients: string[];
  scaleFactor: number;
  measurementSystem: MeasurementSystem;
  desiredServings: number | '';
  handleServingsChange: (value: string) => void;
  toggleMeasurementSystem: () => void;
  addToGroceryList: UseMutationResult<any, Error, void, any>;
  recipe: {
    suggested_portions: number;
    portion_description: string;
  };
}

export function RecipeIngredients({
  ingredients,
  scaleFactor,
  measurementSystem,
  desiredServings,
  handleServingsChange,
  toggleMeasurementSystem,
  addToGroceryList,
  recipe
}: RecipeIngredientsProps) {
  const handleIncrement = () => {
    const currentValue = typeof desiredServings === 'number' ? desiredServings : 1;
    handleServingsChange((currentValue + 1).toString());
  };

  const handleDecrement = () => {
    const currentValue = typeof desiredServings === 'number' ? desiredServings : 1;
    if (currentValue > 1) {
      handleServingsChange((currentValue - 1).toString());
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Servings:</span>
          <div className="flex items-center">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-r-none"
              onClick={handleDecrement}
              disabled={desiredServings === 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              type="number"
              min="1"
              value={desiredServings}
              onChange={(e) => handleServingsChange(e.target.value)}
              className="w-16 h-8 rounded-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-l-none"
              onClick={handleIncrement}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <span className="text-sm text-muted-foreground">
            {recipe.portion_description}
          </span>
        </div>
        {recipe.suggested_portions !== desiredServings && (
          <span className="text-sm text-muted-foreground">
            (Suggested: {recipe.suggested_portions})
          </span>
        )}
      </div>

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