type ConversionMap = {
  [key: string]: {
    to: { [key: string]: number };
    defaultTarget: string;
    system: 'imperial' | 'metric';
  };
};

const conversionTable: ConversionMap = {
  // Imperial volume to metric
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
  
  // Imperial weight to metric
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
  
  // Metric volume to imperial
  'ml': {
    to: { 'cup': 0.00422675, 'tbsp': 0.067628, 'tsp': 0.202884 },
    defaultTarget: 'cup',
    system: 'metric'
  },
  'milliliter': {
    to: { 'cup': 0.00422675, 'tbsp': 0.067628, 'tsp': 0.202884 },
    defaultTarget: 'cup',
    system: 'metric'
  },
  'milliliters': {
    to: { 'cup': 0.00422675, 'tbsp': 0.067628, 'tsp': 0.202884 },
    defaultTarget: 'cup',
    system: 'metric'
  },
  'l': {
    to: { 'cup': 4.22675, 'tbsp': 67.628, 'tsp': 202.884 },
    defaultTarget: 'cup',
    system: 'metric'
  },
  'liter': {
    to: { 'cup': 4.22675, 'tbsp': 67.628, 'tsp': 202.884 },
    defaultTarget: 'cup',
    system: 'metric'
  },
  'liters': {
    to: { 'cup': 4.22675, 'tbsp': 67.628, 'tsp': 202.884 },
    defaultTarget: 'cup',
    system: 'metric'
  },
  
  // Metric weight to imperial
  'g': {
    to: { 'oz': 0.035274 },
    defaultTarget: 'oz',
    system: 'metric'
  },
  'gram': {
    to: { 'oz': 0.035274 },
    defaultTarget: 'oz',
    system: 'metric'
  },
  'grams': {
    to: { 'oz': 0.035274 },
    defaultTarget: 'oz',
    system: 'metric'
  },
  'kg': {
    to: { 'lb': 2.20462 },
    defaultTarget: 'lb',
    system: 'metric'
  },
  'kilogram': {
    to: { 'lb': 2.20462 },
    defaultTarget: 'lb',
    system: 'metric'
  },
  'kilograms': {
    to: { 'lb': 2.20462 },
    defaultTarget: 'lb',
    system: 'metric'
  }
};

function chooseAppropriateUnit(quantity: number, unit: string, targetSystem: 'metric' | 'imperial'): string {
  // For metric system
  if (targetSystem === 'metric') {
    if (unit === 'g' && quantity >= 1000) {
      return 'kg';
    }
    if (unit === 'ml' && quantity >= 1000) {
      return 'l';
    }
  }
  // For imperial system
  else {
    if (unit === 'oz' && quantity >= 16) {
      return 'lb';
    }
    if (unit === 'tsp' && quantity >= 3) {
      return 'tbsp';
    }
    if (unit === 'tbsp' && quantity >= 16) {
      return 'cup';
    }
  }
  return unit;
}

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

  let convertedQuantity = quantity * conversionFactor;
  let targetUnit = defaultTarget;

  // Choose more appropriate unit based on the quantity
  const appropriateUnit = chooseAppropriateUnit(convertedQuantity, targetUnit, targetSystem);
  if (appropriateUnit !== targetUnit) {
    if (appropriateUnit === 'kg' && targetUnit === 'g') {
      convertedQuantity /= 1000;
    } else if (appropriateUnit === 'l' && targetUnit === 'ml') {
      convertedQuantity /= 1000;
    } else if (appropriateUnit === 'lb' && targetUnit === 'oz') {
      convertedQuantity /= 16;
    } else if (appropriateUnit === 'tbsp' && targetUnit === 'tsp') {
      convertedQuantity /= 3;
    } else if (appropriateUnit === 'cup' && targetUnit === 'tbsp') {
      convertedQuantity /= 16;
    }
    targetUnit = appropriateUnit;
  }

  return {
    quantity: convertedQuantity,
    unit: targetUnit
  };
}
