
import { ScaledIngredient, RecipeData } from "@/types/recipe";

export const parseIngredient = (text: string): ScaledIngredient => {
  const match = text.match(/^([\d.\/]+)\s*([a-zA-Z]+)?\s+(.+)$/);
  if (match) {
    const [, quantity, unit, ingredient] = match;
    const numericQuantity = quantity.includes('/') 
      ? eval(quantity)
      : parseFloat(quantity);
    return {
      quantity: numericQuantity,
      unit: unit || '',
      ingredient,
      originalText: text
    };
  }
  return {
    quantity: 1,
    unit: '',
    ingredient: text,
    originalText: text
  };
};

export const scaleRecipe = (recipe: RecipeData, newPortions: number, originalPortions: number) => {
  if (!recipe || newPortions <= 0 || originalPortions <= 0) return recipe;

  const scaleFactor = newPortions / originalPortions;

  const scaledIngredients = recipe.ingredients.map(ing => {
    const parsed = parseIngredient(ing);
    if (parsed.quantity && parsed.unit) {
      const scaledQuantity = parsed.quantity * scaleFactor;
      return `${scaledQuantity.toFixed(2)} ${parsed.unit} ${parsed.ingredient}`;
    }
    return ing;
  });

  const scaledPrep = recipe.prep_time ? Math.round(recipe.prep_time * Math.sqrt(scaleFactor)) : undefined;
  const scaledCook = recipe.cook_time ? Math.round(recipe.cook_time * Math.sqrt(scaleFactor)) : undefined;
  const scaledCalories = recipe.estimated_calories 
    ? Math.round(recipe.estimated_calories * scaleFactor)
    : undefined;

  return {
    ...recipe,
    ingredients: scaledIngredients,
    prep_time: scaledPrep,
    cook_time: scaledCook,
    estimated_calories: scaledCalories
  };
};
