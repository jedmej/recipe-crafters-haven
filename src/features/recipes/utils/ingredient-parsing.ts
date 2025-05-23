
import { MeasurementSystem } from '../types';

// Common conversion factors
const IMPERIAL_TO_METRIC = {
  // Volume
  'cup': 236.6, // ml
  'cups': 236.6, // ml
  'c': 236.6, // ml
  'tablespoon': 14.79, // ml
  'tablespoons': 14.79, // ml
  'tbsp': 14.79, // ml
  'teaspoon': 4.93, // ml
  'teaspoons': 4.93, // ml
  'tsp': 4.93, // ml
  'fl oz': 29.57, // ml
  'fluid ounce': 29.57, // ml
  'fluid ounces': 29.57, // ml
  'pint': 473.2, // ml
  'pints': 473.2, // ml
  'pt': 473.2, // ml
  'quart': 946.4, // ml
  'quarts': 946.4, // ml
  'qt': 946.4, // ml
  'gallon': 3785, // ml
  'gallons': 3785, // ml
  'gal': 3785, // ml
  
  // Weight
  'ounce': 28.35, // g
  'ounces': 28.35, // g
  'oz': 28.35, // g
  'pound': 453.6, // g
  'pounds': 453.6, // g
  'lb': 453.6, // g
  'lbs': 453.6, // g
};

const METRIC_TO_IMPERIAL = {
  // Volume
  'ml': 0.0042, // cups
  'milliliter': 0.0042, // cups
  'milliliters': 0.0042, // cups
  'l': 4.227, // cups
  'liter': 4.227, // cups
  'liters': 4.227, // cups
  
  // Weight
  'g': 0.035, // oz
  'gram': 0.035, // oz
  'grams': 0.035, // oz
  'kg': 2.205, // lbs
  'kilogram': 2.205, // lbs
  'kilograms': 2.205, // lbs
};

const IMPERIAL_UNITS = [
  'cup', 'cups', 'c', 
  'tablespoon', 'tablespoons', 'tbsp', 'tbs', 'tb',
  'teaspoon', 'teaspoons', 'tsp',
  'fluid ounce', 'fluid ounces', 'fl oz',
  'pint', 'pints', 'pt',
  'quart', 'quarts', 'qt',
  'gallon', 'gallons', 'gal',
  'ounce', 'ounces', 'oz',
  'pound', 'pounds', 'lb', 'lbs',
  'inch', 'inches', 'in',
];

const METRIC_UNITS = [
  'milliliter', 'milliliters', 'ml',
  'liter', 'liters', 'l',
  'gram', 'grams', 'g',
  'kilogram', 'kilograms', 'kg',
  'centimeter', 'centimeters', 'cm',
  'meter', 'meters', 'm',
];

// Regular expression for parsing ingredient amounts and units
const INGREDIENT_REGEX = /^((?:[\d½⅓¼⅕⅙⅛⅔¾⅖⅗⅘⅞]+\s*[+\-]?\s*)+(?:\/[\d]+)?)\s*([a-zA-Z]+(?:\s*[a-zA-Z]+)?)?\s*(.+)$/;
const FRACTION_MAP: Record<string, number> = {
  '½': 0.5,
  '⅓': 0.33,
  '¼': 0.25,
  '⅕': 0.2,
  '⅙': 0.167,
  '⅛': 0.125,
  '⅔': 0.667,
  '¾': 0.75,
  '⅖': 0.4,
  '⅗': 0.6,
  '⅘': 0.8,
  '⅞': 0.875
};

/**
 * Convert a fractional string to a decimal number
 */
function convertFractionToDecimal(fraction: string): number {
  if (fraction in FRACTION_MAP) {
    return FRACTION_MAP[fraction];
  }
  
  if (fraction.includes('/')) {
    const [numerator, denominator] = fraction.split('/').map(Number);
    return numerator / denominator;
  }
  
  return parseFloat(fraction);
}

/**
 * Parse a quantity string that may include fractions
 */
function parseQuantity(quantityStr: string): number {
  // Handle Unicode fractions
  for (const [fractionChar, value] of Object.entries(FRACTION_MAP)) {
    if (quantityStr.includes(fractionChar)) {
      const parts = quantityStr.split(fractionChar);
      const wholeNumber = parts[0] ? parseFloat(parts[0]) : 0;
      return wholeNumber + value;
    }
  }

  // Handle simple numeric values
  if (!quantityStr.includes('/')) {
    return parseFloat(quantityStr);
  }

  // Handle mixed numbers (e.g., "1 1/2")
  const parts = quantityStr.trim().split(/\s+/);
  if (parts.length === 2) {
    return parseFloat(parts[0]) + convertFractionToDecimal(parts[1]);
  }

  // Handle simple fractions (e.g., "1/2")
  return convertFractionToDecimal(quantityStr);
}

/**
 * Parse an ingredient string into its components
 */
export function parseIngredient(ingredientText: string): {
  quantity: number | null;
  unit: string | null;
  name: string;
  original: string;
} {
  const match = ingredientText.trim().match(INGREDIENT_REGEX);
  
  if (!match) {
    return {
      quantity: null,
      unit: null,
      name: ingredientText.trim(),
      original: ingredientText
    };
  }
  
  const [, quantityStr, unitStr, name] = match;
  
  try {
    const quantity = quantityStr ? parseQuantity(quantityStr) : null;
    const unit = unitStr?.trim() || null;
    
    return {
      quantity,
      unit,
      name: name.trim(),
      original: ingredientText
    };
  } catch (error) {
    console.error('Error parsing ingredient:', ingredientText, error);
    return {
      quantity: null,
      unit: null,
      name: ingredientText.trim(),
      original: ingredientText
    };
  }
}

/**
 * Scale an ingredient by a factor and convert units if needed
 */
export function scaleAndConvertIngredient(
  ingredient: string,
  scaleFactor: number = 1,
  targetSystem: MeasurementSystem = 'metric'
): string {
  const parsed = parseIngredient(ingredient);
  
  // If we couldn't parse quantity or there's no unit, just return the original
  if (parsed.quantity === null || parsed.unit === null) {
    return ingredient;
  }

  // Scale the quantity
  let newQuantity = parsed.quantity * scaleFactor;
  let newUnit = parsed.unit;
  
  // Convert units if necessary
  if (targetSystem === 'metric' && IMPERIAL_UNITS.includes(parsed.unit.toLowerCase())) {
    const conversionFactor = IMPERIAL_TO_METRIC[parsed.unit.toLowerCase() as keyof typeof IMPERIAL_TO_METRIC];
    if (conversionFactor) {
      newQuantity = newQuantity * conversionFactor;
      
      // Choose appropriate metric unit
      if (parsed.unit.toLowerCase().includes('cup') || 
          parsed.unit.toLowerCase().includes('pint') || 
          parsed.unit.toLowerCase().includes('quart') || 
          parsed.unit.toLowerCase().includes('gallon') ||
          parsed.unit.toLowerCase().includes('fluid') || 
          parsed.unit.toLowerCase().includes('fl oz')) {
        newUnit = newQuantity >= 1000 ? 'l' : 'ml';
        if (newQuantity >= 1000) newQuantity /= 1000;
      } else if (parsed.unit.toLowerCase().includes('ounce') || 
                parsed.unit.toLowerCase().includes('oz') ||
                parsed.unit.toLowerCase().includes('pound') || 
                parsed.unit.toLowerCase().includes('lb')) {
        newUnit = newQuantity >= 1000 ? 'kg' : 'g';
        if (newQuantity >= 1000) newQuantity /= 1000;
      }
    }
  } else if (targetSystem === 'imperial' && METRIC_UNITS.includes(parsed.unit.toLowerCase())) {
    const conversionFactor = METRIC_TO_IMPERIAL[parsed.unit.toLowerCase() as keyof typeof METRIC_TO_IMPERIAL];
    if (conversionFactor) {
      newQuantity = newQuantity * conversionFactor;
      
      // Choose appropriate imperial unit
      if (parsed.unit.toLowerCase() === 'ml' || 
          parsed.unit.toLowerCase() === 'milliliter' ||
          parsed.unit.toLowerCase() === 'milliliters') {
        newUnit = 'tsp';
        if (newQuantity >= 3) {
          newQuantity /= 3;
          newUnit = 'tbsp';
          if (newQuantity >= 16) {
            newQuantity /= 16;
            newUnit = 'cup';
          }
        }
      } else if (parsed.unit.toLowerCase() === 'l' || 
                parsed.unit.toLowerCase() === 'liter' || 
                parsed.unit.toLowerCase() === 'liters') {
        newUnit = 'cup';
        if (newQuantity >= 4) {
          newQuantity /= 4;
          newUnit = 'quart';
          if (newQuantity >= 4) {
            newQuantity /= 4;
            newUnit = 'gallon';
          }
        }
      } else if (parsed.unit.toLowerCase() === 'g' || 
                parsed.unit.toLowerCase() === 'gram' || 
                parsed.unit.toLowerCase() === 'grams') {
        newUnit = 'oz';
        if (newQuantity >= 16) {
          newQuantity /= 16;
          newUnit = 'lb';
        }
      } else if (parsed.unit.toLowerCase() === 'kg' || 
                parsed.unit.toLowerCase() === 'kilogram' || 
                parsed.unit.toLowerCase() === 'kilograms') {
        newUnit = 'lb';
      }
    }
  }
  
  // Format quantity nicely
  let formattedQuantity: string;
  if (Number.isInteger(newQuantity)) {
    formattedQuantity = newQuantity.toString();
  } else {
    // Round to 2 decimal places
    const rounded = Math.round(newQuantity * 100) / 100;
    
    // Check if it's close to common fractions
    const fractions = [
      { value: 0.25, fraction: '1/4' },
      { value: 0.33, fraction: '1/3' },
      { value: 0.5, fraction: '1/2' },
      { value: 0.67, fraction: '2/3' },
      { value: 0.75, fraction: '3/4' }
    ];
    
    let isFraction = false;
    for (const { value, fraction } of fractions) {
      if (Math.abs(rounded % 1 - value) < 0.05) {
        const whole = Math.floor(rounded);
        formattedQuantity = whole > 0 ? `${whole} ${fraction}` : fraction;
        isFraction = true;
        break;
      }
    }
    
    // If not close to a common fraction
    if (!isFraction) {
      formattedQuantity = rounded.toString();
      // Remove trailing zeros after the decimal
      formattedQuantity = formattedQuantity.replace(/\.0+$/, '');
    }
  }
  
  return `${formattedQuantity} ${newUnit} ${parsed.name}`;
}
