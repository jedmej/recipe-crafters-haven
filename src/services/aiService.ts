import { supabase } from "@/integrations/supabase/client";
import { BaseService } from "./baseService";
import { RecipeData } from "@/types/recipe";

export class AIService extends BaseService {
  /**
   * Search for recipe using AI
   */
  async searchRecipe(query: string, language: string): Promise<RecipeData> {
    try {
      const session = await this.getSession();
      
      const API_URL = 'https://yorijihyeahhfprgjkvp.supabase.co/functions/v1/recipe-chat';
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ query, language }),
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${JSON.stringify(responseData)}`);
      }

      if (!responseData.success || !responseData.data) {
        console.error('API returned unsuccessful response:', responseData);
        throw new Error(responseData.error || 'Failed to get recipe data');
      }

      const apiResponse = responseData.data;
      const recipe: RecipeData = {
        title: apiResponse.title,
        description: apiResponse.description,
        ingredients: apiResponse.ingredients,
        instructions: apiResponse.instructions,
        suggested_portions: apiResponse.suggested_portions,
        source_url: apiResponse.source_url ?? null,
        cook_time: apiResponse.cook_time ?? null,
        prep_time: apiResponse.prep_time ?? null,
        estimated_calories: apiResponse.estimated_calories ?? null,
        portion_description: apiResponse.portion_description ?? `Serves ${apiResponse.suggested_portions}`,
        categories: {
          meal_type: apiResponse.categories?.meal_type || 'Other',
          dietary_restrictions: Array.isArray(apiResponse.categories?.dietary_restrictions) 
            ? apiResponse.categories.dietary_restrictions 
            : [apiResponse.categories?.dietary_restrictions || 'None'],
          difficulty_level: apiResponse.categories?.difficulty_level || 'Medium',
          cuisine_type: apiResponse.categories?.cuisine_type || 'Other',
          cooking_method: Array.isArray(apiResponse.categories?.cooking_method)
            ? apiResponse.categories.cooking_method
            : [apiResponse.categories?.cooking_method || 'Other']
        }
      };

      return recipe;
    } catch (error) {
      return this.handleError(error, "Failed to search for recipe with AI");
    }
  }

  /**
   * Generate recipe with AI based on ingredients, preferences, etc.
   */
  async generateRecipe(options: { 
    ingredients?: string[]; 
    cuisine?: string;
    diet?: string;
    mealType?: string;
    language: string;
  }): Promise<RecipeData> {
    try {
      const session = await this.getSession();
      
      const { data, error } = await supabase.functions.invoke('ai-recipe-generate', {
        body: {
          ingredients: options.ingredients || [],
          cuisine: options.cuisine,
          diet: options.diet,
          mealType: options.mealType,
          language: options.language
        }
      });
      
      if (error) {
        return this.handleError(error, "Failed to generate recipe with AI");
      }
      
      return data as RecipeData;
    } catch (error) {
      return this.handleError(error, "Failed to generate recipe with AI");
    }
  }

  /**
   * Categorize a grocery item using AI
   */
  async categorizeGroceryItem(itemName: string): Promise<string> {
    try {
      const session = await this.getSession();
      
      const { data, error } = await supabase.functions.invoke('categorize-grocery', {
        body: { item: itemName }
      });
      
      if (error || !data?.category) {
        console.error('Error from categorize function:', error || 'No category returned');
        throw error || new Error('Failed to categorize item');
      }
      
      return data.category;
    } catch (error) {
      console.error('Error categorizing item:', error);
      throw error;
    }
  }
} 