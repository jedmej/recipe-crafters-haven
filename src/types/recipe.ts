
export interface RecipeData {
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  prep_time?: number;
  cook_time?: number;
  estimated_calories?: number;
  suggested_portions: number;
  portion_description: string;
  language?: string;
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
