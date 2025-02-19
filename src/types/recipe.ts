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
