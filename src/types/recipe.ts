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
  language?: string;
  user_id?: string;
  created_at?: string;
  portion_description: string;
  categories?: {
    meal_type: string;
    dietary_restrictions: string[];
    difficulty_level: string;
    cuisine_type: string;
    cooking_method: string[];
  };
}

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
] as const;

export const RECIPE_CATEGORIES = {
  meal_type: ['breakfast', 'lunch', 'dinner', 'snack', 'dessert'],
  dietary_restrictions: ['vegetarian', 'vegan', 'gluten-free', 'low-carb', 'dairy-free', 'none'],
  difficulty_level: ['easy', 'intermediate', 'advanced'],
  cuisine_type: ['Italian', 'Mexican', 'Asian', 'Mediterranean', 'French', 'American', 'Indian'],
  cooking_method: ['baked', 'grilled', 'fried', 'slow-cooked', 'steamed', 'raw']
} as const;
