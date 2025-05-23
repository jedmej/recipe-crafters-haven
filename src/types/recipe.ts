
export interface RecipeData {
  id?: string;
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  cook_time?: number;
  prep_time?: number;
  estimated_calories?: number;
  suggested_portions: number;
  portion_size?: number;
  source_url?: string;
  imageUrl?: string;
  image_url?: string; // Supporting both property names
  language?: string;
  user_id?: string;
  created_at?: string;
  portion_description: string;
  categories?: {
    meal_type: string;
    dietary_restrictions: string | string[];
    difficulty_level: string;
    cuisine_type: string;
    cooking_method: string | string[];
    occasion?: string;
    course_category?: string;
    taste_profile?: string | string[];
    secondary_dietary_restrictions?: string[];
  };
}

// Adding the Recipe type as an alias to RecipeData for backward compatibility
export type Recipe = RecipeData;

export interface ScaledIngredient {
  quantity: number;
  unit: string;
  ingredient: string;
  originalText: string;
}

export const SUPPORTED_LANGUAGES = [
  { value: 'pl', label: 'Polish' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'ru', label: 'Russian' },
  { value: 'uk', label: 'Ukrainian' },
] as const;

export const RECIPE_CATEGORIES = {
  meal_type: ['breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'appetizer', 'soup', 'side dish'],
  dietary_restrictions: ['vegetarian', 'vegan', 'gluten-free', 'low-carb', 'dairy-free', 'none', 'halal', 'kosher', 'nut-free', 'low-sodium'],
  difficulty_level: ['easy', 'medium', 'hard', 'expert'],
  cuisine_type: ['Italian', 'Mexican', 'Chinese', 'Japanese', 'Thai', 'French', 'Middle Eastern', 'Indian', 'American', 'Mediterranean', 'Caribbean', 'Greek', 'Spanish'],
  cooking_method: ['baking', 'frying', 'grilling', 'roasting', 'steaming', 'boiling', 'slow cooking', 'sous vide'],
  occasion: ['everyday', 'party', 'holiday', 'birthday'],
  course_category: ['soup', 'salad', 'main course', 'side dish', 'dessert', 'beverage'],
  taste_profile: ['sweet', 'savory', 'spicy', 'sour', 'salty', 'bitter', 'umami', 'tangy', 'mild']
} as const;
