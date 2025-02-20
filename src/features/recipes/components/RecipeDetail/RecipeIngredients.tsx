import React from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
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
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Ingredients</h3>
      </CardHeader>
      <CardContent>
        <ul className="list-disc list-inside space-y-2 mb-6">
          {ingredients.map((ingredient, index) => (
            <li key={index} className="text-gray-700">
              {scaleAndConvertIngredient(ingredient, scaleFactor, measurementSystem)}
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
      </CardContent>
    </Card>
  );
} 