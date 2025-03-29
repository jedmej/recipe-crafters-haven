import { supabase } from "@/integrations/supabase/client";
import { BaseService } from "./baseService";
import { RecipeFormData } from "@/features/recipes/types";
import { RecipeData } from "@/types/recipe";
import { Database } from "@/integrations/supabase/types";

type Recipe = Database['public']['Tables']['recipes']['Row'];

export class RecipeService extends BaseService {
  /**
   * Get all recipes for the current user
   */
  async getAllRecipes() {
    try {
      const user = await this.getCurrentUser();
      
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        return this.handleError(error, "Failed to fetch recipes");
      }
      
      return data;
    } catch (error) {
      return this.handleError(error, "Failed to fetch recipes");
    }
  }

  /**
   * Get a recipe by ID
   */
  async getRecipeById(id: string) {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        return this.handleError(error, "Failed to fetch recipe");
      }
      
      return data;
    } catch (error) {
      return this.handleError(error, "Failed to fetch recipe");
    }
  }

  /**
   * Create a new recipe
   */
  async createRecipe(formData: RecipeFormData) {
    try {
      const user = await this.getCurrentUser();
      
      // Filter out empty ingredients and instructions
      const filteredData = {
        ...formData,
        ingredients: formData.ingredients.filter(i => i.trim() !== ""),
        instructions: formData.instructions.filter(i => i.trim() !== ""),
        categories: {
          meal_type: formData.categories?.meal_type || 'Other',
          dietary_restrictions: Array.isArray(formData.categories?.dietary_restrictions)
            ? formData.categories.dietary_restrictions
            : [formData.categories?.dietary_restrictions || 'None'],
          difficulty_level: formData.categories?.difficulty_level || 'Medium',
          cuisine_type: formData.categories?.cuisine_type || 'Other',
          cooking_method: Array.isArray(formData.categories?.cooking_method)
            ? formData.categories.cooking_method
            : [formData.categories?.cooking_method || 'Other']
        },
        user_id: user.id
      };

      const { data, error } = await supabase
        .from('recipes')
        .insert([filteredData])
        .select()
        .single();
      
      if (error) {
        return this.handleError(error, "Failed to create recipe");
      }
      
      return data;
    } catch (error) {
      return this.handleError(error, "Failed to create recipe");
    }
  }

  /**
   * Update an existing recipe
   */
  async updateRecipe(recipeId: string, formData: RecipeFormData) {
    try {
      if (!recipeId) {
        throw new Error("Recipe ID is required for updates");
      }
      
      // Filter out empty ingredients and instructions
      const filteredData = {
        ...formData,
        ingredients: formData.ingredients.filter(i => i.trim() !== ""),
        instructions: formData.instructions.filter(i => i.trim() !== ""),
        categories: {
          meal_type: formData.categories?.meal_type || 'Other',
          dietary_restrictions: Array.isArray(formData.categories?.dietary_restrictions)
            ? formData.categories.dietary_restrictions
            : [formData.categories?.dietary_restrictions || 'None'],
          difficulty_level: formData.categories?.difficulty_level || 'Medium',
          cuisine_type: formData.categories?.cuisine_type || 'Other',
          cooking_method: Array.isArray(formData.categories?.cooking_method)
            ? formData.categories.cooking_method
            : [formData.categories?.cooking_method || 'Other']
        }
      };

      const { data, error } = await supabase
        .from('recipes')
        .update(filteredData)
        .eq('id', recipeId)
        .select()
        .single();
      
      if (error) {
        return this.handleError(error, "Failed to update recipe");
      }
      
      return data;
    } catch (error) {
      return this.handleError(error, "Failed to update recipe");
    }
  }

  /**
   * Delete a recipe by ID
   */
  async deleteRecipe(recipeId: string) {
    try {
      if (!recipeId) {
        throw new Error("Recipe ID is required for deletion");
      }

      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', recipeId);
      
      if (error) {
        return this.handleError(error, "Failed to delete recipe");
      }
      
      return true;
    } catch (error) {
      return this.handleError(error, "Failed to delete recipe");
    }
  }

  /**
   * Update recipe image
   */
  async updateRecipeImage(recipeId: string, imageUrl: string) {
    try {
      const { error } = await supabase
        .from('recipes')
        .update({ image_url: imageUrl })
        .eq('id', recipeId);

      if (error) {
        return this.handleError(error, "Failed to update recipe image");
      }
      
      return imageUrl;
    } catch (error) {
      return this.handleError(error, "Failed to update recipe image");
    }
  }

  /**
   * Save an AI-suggested recipe
   */
  async saveAIRecipe(recipe: RecipeData, chosenPortions: number) {
    try {
      const user = await this.getCurrentUser();
      
      // Ensure categories are properly formatted
      const formattedCategories = {
        meal_type: recipe.categories?.meal_type || 'Other',
        dietary_restrictions: Array.isArray(recipe.categories?.dietary_restrictions)
          ? recipe.categories.dietary_restrictions
          : [recipe.categories?.dietary_restrictions || 'None'],
        difficulty_level: recipe.categories?.difficulty_level || 'Medium',
        cuisine_type: recipe.categories?.cuisine_type || 'Other',
        cooking_method: Array.isArray(recipe.categories?.cooking_method)
          ? recipe.categories.cooking_method
          : [recipe.categories?.cooking_method || 'Other']
      };

      const recipeToSave = {
        title: recipe.title,
        description: recipe.description,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        cook_time: recipe.cook_time,
        prep_time: recipe.prep_time,
        estimated_calories: recipe.estimated_calories,
        suggested_portions: recipe.suggested_portions,
        portion_size: chosenPortions,
        source_url: recipe.source_url,
        image_url: recipe.imageUrl,
        categories: formattedCategories,
        user_id: user.id
      };

      const { data, error } = await supabase
        .from('recipes')
        .insert([recipeToSave])
        .select()
        .single();

      if (error) {
        return this.handleError(error, "Failed to save AI recipe");
      }
      
      return data;
    } catch (error) {
      return this.handleError(error, "Failed to save AI recipe");
    }
  }
} 