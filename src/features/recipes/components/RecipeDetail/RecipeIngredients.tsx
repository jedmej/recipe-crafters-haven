import React from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Ingredients</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="servings">Servings:</Label>
              <Input
                id="servings"
                type="number"
                min="1"
                value={desiredServings}
                onChange={(e) => handleServingsChange(e.target.value)}
                className="w-20"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="measurement">Imperial:</Label>
              <Switch
                id="measurement"
                checked={measurementSystem === 'imperial'}
                onCheckedChange={toggleMeasurementSystem}
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="list-disc list-inside space-y-2">
          {ingredients.map((ingredient, index) => (
            <li key={index} className="text-gray-700">
              {scaleAndConvertIngredient(ingredient, scaleFactor, measurementSystem)}
            </li>
          ))}
        </ul>
        
        <div className="mt-6 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => addToGroceryList.mutate()}
            disabled={addToGroceryList.isPending || !addToGroceryList.mutate}
          >
            {addToGroceryList.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <ListPlus className="h-4 w-4 mr-2" />
            )}
            {addToGroceryList.isPending ? 'Adding...' : 'Add to Grocery List'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 