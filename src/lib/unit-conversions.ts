
type ConversionMap = {
  [key: string]: {
    to: { [key: string]: number };
    defaultTarget: string;
    system: 'imperial' | 'metric';
  };
};

const conversionTable: ConversionMap = {
  'cup': {
    to: { 'ml': 236.588, 'l': 0.236588 },
    defaultTarget: 'ml',
    system: 'imperial'
  },
  'cups': {
    to: { 'ml': 236.588, 'l': 0.236588 },
    defaultTarget: 'ml',
    system: 'imperial'
  },
  'tbsp': {
    to: { 'ml': 14.7868 },
    defaultTarget: 'ml',
    system: 'imperial'
  },
  'tablespoon': {
    to: { 'ml': 14.7868 },
    defaultTarget: 'ml',
    system: 'imperial'
  },
  'tablespoons': {
    to: { 'ml': 14.7868 },
    defaultTarget: 'ml',
    system: 'imperial'
  },
  'tsp': {
    to: { 'ml': 4.92892 },
    defaultTarget: 'ml',
    system: 'imperial'
  },
  'teaspoon': {
    to: { 'ml': 4.92892 },
    defaultTarget: 'ml',
    system: 'imperial'
  },
  'teaspoons': {
    to: { 'ml': 4.92892 },
    defaultTarget: 'ml',
    system: 'imperial'
  },
  'oz': {
    to: { 'g': 28.3495 },
    defaultTarget: 'g',
    system: 'imperial'
  },
  'ounce': {
    to: { 'g': 28.3495 },
    defaultTarget: 'g',
    system: 'imperial'
  },
  'ounces': {
    to: { 'g': 28.3495 },
    defaultTarget: 'g',
    system: 'imperial'
  },
  'lb': {
    to: { 'kg': 0.453592, 'g': 453.592 },
    defaultTarget: 'g',
    system: 'imperial'
  },
  'pound': {
    to: { 'kg': 0.453592, 'g': 453.592 },
    defaultTarget: 'g',
    system: 'imperial'
  },
  'pounds': {
    to: { 'kg': 0.453592, 'g': 453.592 },
    defaultTarget: 'g',
    system: 'imperial'
  },
  'ml': {
    to: { 'cup': 0.00422675, 'tbsp': 0.067628, 'tsp': 0.202884 },
    defaultTarget: 'cup',
    system: 'metric'
  },
  'g': {
    to: { 'oz': 0.035274 },
    defaultTarget: 'oz',
    system: 'metric'
  },
  'kg': {
    to: { 'lb': 2.20462 },
    defaultTarget: 'lb',
    system: 'metric'
  }
};

export function convertMeasurement(
  quantity: number,
  fromUnit: string,
  targetSystem: 'metric' | 'imperial'
): { quantity: number; unit: string } | null {
  const unit = fromUnit.toLowerCase();
  const conversion = conversionTable[unit];

  if (!conversion || conversion.system === targetSystem) {
    return null;
  }

  const defaultTarget = conversion.defaultTarget;
  const conversionFactor = conversion.to[defaultTarget];

  if (!conversionFactor) {
    return null;
  }

  return {
    quantity: quantity * conversionFactor,
    unit: defaultTarget
  };
}
