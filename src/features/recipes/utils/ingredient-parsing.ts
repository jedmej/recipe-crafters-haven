import { MeasurementSystem } from "@/lib/types";
import { convertMeasurement } from "@/lib/unit-conversions";

const fractionCharMap: { [key: string]: number } = {
  '⅛': 1/8,
  '¼': 1/4,
  '⅓': 1/3,
  '⅜': 3/8,
  '½': 1/2,
  '⅝': 5/8,
  '⅔': 2/3,
  '¾': 3/4,
  '⅞': 7/8
};

export function parseQuantity(ingredient: string): { quantity: number | null; unit: string; item: string } {
  // Enhanced regex to handle mixed numbers, decimals, fractions, and Unicode fractions
  const regex = /^(?:(\d+)\s+)?([\u00BC-\u00BE\u2150-\u215E]|\d+\/\d+|\d*\.?\d+)?\s*([a-zA-Z]*)\s*(.*)/i;
  const match = ingredient.match(regex);

  if (!match) {
    return { quantity: null, unit: "", item: ingredient.trim() };
  }

  const [, wholeStr, fractionStr, unit, item] = match;
  let quantity: number | null = null;

  if (wholeStr || fractionStr) {
    const whole = wholeStr ? parseInt(wholeStr) : 0;
    
    if (fractionStr) {
      if (fractionCharMap[fractionStr]) {
        // Handle Unicode fraction characters
        quantity = whole + fractionCharMap[fractionStr];
      } else if (fractionStr.includes("/")) {
        // Handle regular fractions (e.g., "1/2")
        const [num, denom] = fractionStr.split("/").map(Number);
        quantity = whole + (num / denom);
      } else {
        // Handle decimal numbers
        quantity = whole + parseFloat(fractionStr);
      }
    } else {
      quantity = whole;
    }
  }

  return {
    quantity,
    unit: unit.toLowerCase(),
    item: item.trim()
  };
}

export function formatQuantity(quantity: number): string {
  const fractions: [number, string][] = [
    [1/8, "⅛"], [1/4, "¼"], [1/3, "⅓"], [3/8, "⅜"],
    [1/2, "½"], [5/8, "⅝"], [2/3, "⅔"], [3/4, "¾"],
    [7/8, "⅞"]
  ];

  if (Number.isInteger(quantity)) {
    return quantity.toString();
  }

  const whole = Math.floor(quantity);
  const decimal = quantity - whole;

  for (const [fraction, symbol] of fractions) {
    if (Math.abs(decimal - fraction) < 0.05) {
      return whole > 0 ? `${whole} ${symbol}` : symbol;
    }
  }

  const rounded = Math.round(quantity * 100) / 100;
  return rounded.toString().replace(/\.?0+$/, '');
}

export function scaleIngredient(ingredient: string, scaleFactor: number): string {
  const { quantity, unit, item } = parseQuantity(ingredient);
  
  if (quantity === null) {
    return ingredient;
  }

  const scaledQuantity = quantity * scaleFactor;
  const formattedQuantity = formatQuantity(scaledQuantity);
  
  return `${formattedQuantity}${unit ? ' ' + unit : ''} ${item}`;
}

export function convertIngredient(ingredient: string, targetSystem: MeasurementSystem): string {
  const { quantity, unit, item } = parseQuantity(ingredient);
  
  if (!quantity || !unit) {
    return ingredient;
  }

  const converted = convertMeasurement(quantity, unit, targetSystem);
  if (!converted) {
    return ingredient;
  }

  const formattedQuantity = formatQuantity(converted.quantity);
  return `${formattedQuantity} ${converted.unit} ${item}`;
}

export function scaleAndConvertIngredient(
  ingredient: string, 
  scaleFactor: number, 
  targetSystem: MeasurementSystem
): string {
  const scaledIngredient = scaleIngredient(ingredient, scaleFactor);
  return convertIngredient(scaledIngredient, targetSystem);
} 