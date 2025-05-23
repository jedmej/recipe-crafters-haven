
import { Recipe, RecipeData } from "@/types/recipe";

/**
 * Safely converts a JSON value to a string array
 * @param value - The JSON value to convert
 * @param defaultValue - Optional default value if conversion fails
 * @returns A string array
 */
export function jsonToStringArray(value: any, defaultValue: string[] = []): string[] {
  if (!value) return defaultValue;
  
  if (Array.isArray(value)) {
    return value.map(item => typeof item === 'string' ? item : String(item));
  }
  
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map(item => typeof item === 'string' ? item : String(item));
      }
    } catch (e) {
      // If it's not valid JSON, treat it as a single string item
      return [value];
    }
  }
  
  return defaultValue;
}

/**
 * Safely converts a JSON object to a strongly typed object
 * @param value - The JSON object to convert
 * @param defaultValue - Optional default value if conversion fails
 * @returns The converted object
 */
export function jsonToObject<T>(value: any, defaultValue: T): T {
  if (!value) return defaultValue;
  
  if (typeof value === 'object' && value !== null) {
    return value as T;
  }
  
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch (e) {
      console.error('Error parsing JSON string:', e);
    }
  }
  
  return defaultValue;
}

/**
 * Converts a Supabase recipe record to our RecipeData type
 * @param dbRecipe - The recipe record from the database
 * @returns A RecipeData object
 */
export function dbRecipeToRecipeData(dbRecipe: any): RecipeData {
  if (!dbRecipe) return {} as RecipeData;
  
  return {
    id: dbRecipe.id,
    title: dbRecipe.title || '',
    description: dbRecipe.description || '',
    ingredients: jsonToStringArray(dbRecipe.ingredients),
    instructions: jsonToStringArray(dbRecipe.instructions),
    cook_time: dbRecipe.cook_time || 0,
    prep_time: dbRecipe.prep_time || 0,
    estimated_calories: dbRecipe.estimated_calories || 0,
    suggested_portions: dbRecipe.suggested_portions || dbRecipe.servings || 1,
    portion_size: dbRecipe.portion_size || 1,
    source_url: dbRecipe.source_url || '',
    imageUrl: dbRecipe.image_url || '', // Map image_url to imageUrl for component consumption
    image_url: dbRecipe.image_url || '',
    language: dbRecipe.language || 'en',
    user_id: dbRecipe.user_id || '',
    created_at: dbRecipe.created_at || '',
    portion_description: dbRecipe.portion_description || 'serving',
    categories: dbRecipe.categories ? {
      meal_type: dbRecipe.categories.meal_type || '',
      dietary_restrictions: dbRecipe.categories.dietary_restrictions || '',
      difficulty_level: dbRecipe.categories.difficulty_level || '',
      cuisine_type: dbRecipe.categories.cuisine_type || '',
      cooking_method: dbRecipe.categories.cooking_method || '',
      occasion: dbRecipe.categories.occasion || undefined,
      course_category: dbRecipe.categories.course_category || undefined,
      taste_profile: dbRecipe.categories.taste_profile || undefined,
      secondary_dietary_restrictions: dbRecipe.categories.secondary_dietary_restrictions || undefined
    } : undefined
  };
}

/**
 * Converts our RecipeData type to a Supabase-compatible object
 * @param recipe - The RecipeData object
 * @returns A database-compatible recipe object
 */
export function recipeDataToDbRecipe(recipe: RecipeData): any {
  return {
    id: recipe.id,
    title: recipe.title,
    description: recipe.description,
    ingredients: recipe.ingredients,
    instructions: recipe.instructions,
    cook_time: recipe.cook_time || 0,
    prep_time: recipe.prep_time || 0,
    estimated_calories: recipe.estimated_calories || 0,
    servings: recipe.suggested_portions || 1,
    portion_size: recipe.portion_size || 1,
    source_url: recipe.source_url || '',
    image_url: recipe.image_url || recipe.imageUrl || '',
    language: recipe.language || 'en',
    user_id: recipe.user_id || '',
    portion_description: recipe.portion_description || 'serving',
    categories: recipe.categories || {}
  };
}
