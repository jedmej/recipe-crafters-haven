export interface RecipeData {
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  cook_time: number;
  prep_time: number;
  estimated_calories: number;
  suggested_portions: number;
  portion_description: string;
}

export type RecipeValidation = {
  [K in keyof RecipeData]: unknown;
}; 