import { ScaledIngredient, RecipeData } from "@/types/recipe";

export const parseIngredient = (text: string): ScaledIngredient => {
  const match = text.match(/^([\d./]+)\s*([a-zA-Z]+)?\s+(.+)$/);
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
    return ing; // Keep original text for ingredients without units
  });

  // Scale prep and cook time using square root of scale factor
  // This accounts for the fact that time doesn't scale linearly with portions
  const timeScaleFactor = Math.sqrt(scaleFactor);
  const scaledPrep = recipe.prep_time ? Math.round(recipe.prep_time * timeScaleFactor) : undefined;
  const scaledCook = recipe.cook_time ? Math.round(recipe.cook_time * timeScaleFactor) : undefined;
  
  // Scale calories linearly with portions
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

const fractionRegex = /(\d+\/\d+|\d+\s+\d+\/\d+|\d+\.\d+|\d+)/g;
