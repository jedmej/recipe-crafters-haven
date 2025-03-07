export interface RecipeCategory {
  meal_type?: string;
  dietary_restrictions?: string | string[];
  difficulty_level?: string;
  cuisine_type?: string;
  cooking_method?: string | string[];
  occasion?: string;
  course_category?: string;
  taste_profile?: string | string[];
  secondary_dietary_restrictions?: string[];
}

export interface RecipeFormData {
  id?: string;
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  image_url?: string;
  source_url?: string;
  prep_time: number;
  cook_time: number;
  estimated_calories: number;
  servings: number;
  language?: string;
  categories?: RecipeCategory;
  user_id?: string;
}

export type FormMode = 'create' | 'edit' | 'import';

export type MeasurementSystem = 'metric' | 'imperial';

export interface AiRecipeResponse {
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  prep_time: number;
  cook_time: number;
  estimated_calories: number;
  suggested_portions: number;
  categories?: {
    meal_type: string;
    dietary_restrictions: string | string[];
    difficulty_level: string;
    cuisine_type: string;
    cooking_method: string | string[];
    occasion?: string;
    course_category?: string;
    taste_profile?: string | string[];
  };
}

export const SUPPORTED_LANGUAGES = {
  en: "English",
  es: "Spanish",
  fr: "French",
  it: "Italian",
  de: "German",
  pl: "Polish",
  ru: "Russian",
  uk: "Ukrainian"
}; 