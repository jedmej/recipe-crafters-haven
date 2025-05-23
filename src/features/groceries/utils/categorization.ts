
// Basic categories for groceries
export const GROCERY_CATEGORIES = {
  PRODUCE: 'Produce',
  DAIRY: 'Dairy',
  MEAT: 'Meat & Seafood',
  GRAINS: 'Grains & Bread',
  CANNED: 'Canned & Jarred Goods',
  FROZEN: 'Frozen Foods',
  SNACKS: 'Snacks',
  BAKING: 'Baking',
  SPICES: 'Spices & Seasonings',
  BEVERAGES: 'Beverages',
  CONDIMENTS: 'Condiments & Sauces',
  OTHER: 'Other'
};

// Common ingredients by category
const produceItems = ['apple', 'banana', 'orange', 'lemon', 'lime', 'tomato', 'potato', 'onion', 'garlic', 'ginger', 'carrot', 'celery', 'lettuce', 'spinach', 'kale', 'cucumber', 'zucchini', 'bell pepper', 'jalapeño', 'avocado', 'broccoli', 'cauliflower'];
const dairyItems = ['milk', 'cream', 'butter', 'cheese', 'yogurt', 'sour cream', 'ghee', 'half and half', 'heavy cream', 'whipped cream', 'cream cheese', 'eggs', 'parmesan', 'mozzarella', 'cheddar', 'swiss', 'feta'];
const meatItems = ['chicken', 'beef', 'pork', 'lamb', 'turkey', 'fish', 'salmon', 'tuna', 'shrimp', 'cod', 'tilapia', 'bacon', 'sausage', 'ham', 'ground', 'steak', 'chop', 'roast', 'fillet', 'meat'];
const grainsItems = ['bread', 'rice', 'pasta', 'flour', 'cereal', 'oats', 'quinoa', 'barley', 'couscous', 'noodle', 'tortilla', 'pita', 'bagel', 'bun', 'roll', 'cracker', 'biscuit'];
const cannedItems = ['bean', 'soup', 'broth', 'stock', 'tomato sauce', 'diced tomatoes', 'crushed tomatoes', 'tomato paste', 'corn', 'peas', 'tuna', 'salmon', 'sardine', 'chipotle', 'enchilada sauce'];
const frozenItems = ['frozen', 'ice cream', 'pizza', 'frozen vegetables', 'frozen fruit', 'frozen meal', 'frozen dessert'];
const snackItems = ['chip', 'pretzel', 'nut', 'popcorn', 'cracker', 'cookie', 'candy', 'chocolate', 'granola', 'dried fruit', 'trail mix'];
const bakingItems = ['sugar', 'flour', 'baking powder', 'baking soda', 'yeast', 'vanilla', 'chocolate chip', 'cocoa', 'cornstarch', 'gelatin', 'confectioner\'s sugar', 'brown sugar', 'honey', 'maple syrup', 'molasses'];
const spiceItems = ['salt', 'pepper', 'cinnamon', 'cumin', 'paprika', 'oregano', 'thyme', 'rosemary', 'basil', 'bay leaf', 'chili powder', 'nutmeg', 'ginger', 'turmeric', 'curry powder', 'allspice', 'cayenne', 'sage', 'clove', 'coriander', 'dill'];
const beverageItems = ['water', 'coffee', 'tea', 'juice', 'soda', 'milk', 'wine', 'beer', 'vodka', 'rum', 'whiskey', 'tequila', 'gin', 'cocktail', 'smoothie'];
const condimentItems = ['ketchup', 'mustard', 'mayonnaise', 'sauce', 'dressing', 'vinegar', 'oil', 'olive oil', 'vegetable oil', 'canola oil', 'cooking spray', 'soy sauce', 'hot sauce', 'salsa', 'bbq sauce', 'teriyaki', 'marinade', 'jam', 'jelly', 'peanut butter', 'almond butter', 'syrup'];

/**
 * Categorizes an ingredient based on its text - local implementation
 * @param ingredient - The ingredient to categorize
 * @returns The category for the ingredient, defaults to 'Other'
 */
export function categorizeItemLocally(ingredient: string): string {
  // Convert to lowercase for easier matching
  const ingredientLower = ingredient.toLowerCase();

  // Check each category
  if (produceItems.some(item => ingredientLower.includes(item))) {
    return GROCERY_CATEGORIES.PRODUCE;
  }
  
  if (dairyItems.some(item => ingredientLower.includes(item))) {
    return GROCERY_CATEGORIES.DAIRY;
  }
  
  if (meatItems.some(item => ingredientLower.includes(item))) {
    return GROCERY_CATEGORIES.MEAT;
  }
  
  if (grainsItems.some(item => ingredientLower.includes(item))) {
    return GROCERY_CATEGORIES.GRAINS;
  }
  
  if (cannedItems.some(item => ingredientLower.includes(item))) {
    return GROCERY_CATEGORIES.CANNED;
  }
  
  if (frozenItems.some(item => ingredientLower.includes(item))) {
    return GROCERY_CATEGORIES.FROZEN;
  }
  
  if (snackItems.some(item => ingredientLower.includes(item))) {
    return GROCERY_CATEGORIES.SNACKS;
  }
  
  if (bakingItems.some(item => ingredientLower.includes(item))) {
    return GROCERY_CATEGORIES.BAKING;
  }
  
  if (spiceItems.some(item => ingredientLower.includes(item))) {
    return GROCERY_CATEGORIES.SPICES;
  }
  
  if (beverageItems.some(item => ingredientLower.includes(item))) {
    return GROCERY_CATEGORIES.BEVERAGES;
  }
  
  if (condimentItems.some(item => ingredientLower.includes(item))) {
    return GROCERY_CATEGORIES.CONDIMENTS;
  }

  // If not found in any category
  return GROCERY_CATEGORIES.OTHER;
}

/**
 * Uses AI to categorize an ingredient - mock implementation that forwards to local
 * @param ingredient - The ingredient to categorize
 * @returns A promise that resolves to the ingredient category
 */
export async function categorizeItem(ingredient: string): Promise<string> {
  // For now, just use the local categorization
  return Promise.resolve(categorizeItemLocally(ingredient));
}

/**
 * Helper function to convert ingredient objects to a format suitable for database storage
 */
export function prepareIngredientsForStorage(ingredients: { name: string, checked: boolean, category: string | Promise<string> }[]) {
  return Promise.all(ingredients.map(async (item) => ({
    name: item.name,
    checked: item.checked,
    category: typeof item.category === 'string' ? item.category : await item.category
  })));
}
