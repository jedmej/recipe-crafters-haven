export type CookingTime = {
  min: number;
  max: number;
};

export type MealType = 
  | 'Breakfast'
  | 'Brunch'
  | 'Lunch'
  | 'Dinner'
  | 'Snacks'
  | 'Dessert'
  | 'Appetizer';

export type DietaryRestriction = 
  | 'Vegetarian'
  | 'Vegan'
  | 'Gluten-free'
  | 'Dairy-free'
  | 'Keto'
  | 'Paleo'
  | 'Halal'
  | 'Kosher';

export type DifficultyLevel = 
  | 'Easy'
  | 'Medium'
  | 'Hard';

export type CuisineType = 
  | 'Italian'
  | 'Asian'
  | 'Mexican'
  | 'Mediterranean'
  | 'American'
  | 'Indian'
  | 'Chinese'
  | 'Thai'
  | 'Middle Eastern'
  | 'Japanese'
  | 'French'
  | 'Other';

export type CookingMethod = 
  | 'Oven-baked'
  | 'Stovetop'
  | 'Air Fryer'
  | 'Slow Cooker'
  | 'Instant Pot'
  | 'Grill'
  | 'Sous-vide'
  | 'Microwave';

export interface RecipeFilters {
  cookingTime?: CookingTime;
  mealTypes?: MealType[];
  dietaryRestrictions?: DietaryRestriction[];
  difficultyLevel?: DifficultyLevel;
  cuisineTypes?: CuisineType[];
  cookingMethods?: CookingMethod[];
}

export const DEFAULT_COOKING_TIME: CookingTime = {
  min: 5,
  max: 120
};

export const ALL_MEAL_TYPES: MealType[] = [
  'Breakfast',
  'Brunch',
  'Lunch',
  'Dinner',
  'Snacks',
  'Dessert',
  'Appetizer'
];

export const ALL_DIETARY_RESTRICTIONS: DietaryRestriction[] = [
  'Vegetarian',
  'Vegan',
  'Gluten-free',
  'Dairy-free',
  'Keto',
  'Paleo',
  'Halal',
  'Kosher'
];

export const ALL_DIFFICULTY_LEVELS: DifficultyLevel[] = [
  'Easy',
  'Medium',
  'Hard'
];

export const ALL_CUISINE_TYPES: CuisineType[] = [
  'Italian',
  'Asian',
  'Mexican',
  'Mediterranean',
  'American',
  'Indian',
  'Chinese',
  'Thai',
  'Middle Eastern',
  'Japanese',
  'French',
  'Other'
];

export const ALL_COOKING_METHODS: CookingMethod[] = [
  'Oven-baked',
  'Stovetop',
  'Air Fryer',
  'Slow Cooker',
  'Instant Pot',
  'Grill',
  'Sous-vide',
  'Microwave'
]; 