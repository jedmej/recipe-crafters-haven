import { supabase } from "@/integrations/supabase/client";
import { BaseService } from "./baseService";
import { categorizeItemLocally } from "@/features/groceries/utils/categorization";
import { AIService } from "./aiService";

interface GroceryItem {
  name: string;
  checked: boolean;
  category?: string;
}

export class GroceryService extends BaseService {
  private aiService: AIService;

  constructor() {
    super();
    this.aiService = new AIService();
  }

  /**
   * Get all grocery lists for the current user
   */
  async getAllGroceryLists() {
    try {
      const user = await this.getCurrentUser();
      
      const { data, error } = await supabase
        .from('grocery_lists')
        .select(`
          *,
          recipe:recipes (
            id,
            title,
            image_url
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        return this.handleError(error, "Failed to fetch grocery lists");
      }
      
      return data;
    } catch (error) {
      return this.handleError(error, "Failed to fetch grocery lists");
    }
  }

  /**
   * Get a specific grocery list by ID
   */
  async getGroceryList(id: string) {
    try {
      const { data, error } = await supabase
        .from('grocery_lists')
        .select(`
          *,
          recipe:recipes (
            id,
            title,
            image_url
          )
        `)
        .eq('id', id)
        .single();
      
      if (error) {
        return this.handleError(error, "Failed to fetch grocery list");
      }

      // Process items to ensure they all have categories
      const items = Array.isArray(data.items) 
        ? (data.items as (string | GroceryItem)[]).map(item => {
            if (typeof item === 'string') {
              // For string items, create a new GroceryItem with local categorization
              return { 
                name: item, 
                checked: false,
                category: categorizeItemLocally(item) 
              };
            }
            // For existing GroceryItem objects, ensure they have a category
            return {
              ...item,
              category: item.category || (item.name ? categorizeItemLocally(item.name) : undefined)
            } as GroceryItem;
          })
        : [];

      const result = { ...data, items };

      // Update categories with AI in the background
      setTimeout(() => this.updateItemCategoriesWithAI(id, items), 100);

      return result;
    } catch (error) {
      return this.handleError(error, "Failed to fetch grocery list");
    }
  }

  /**
   * Create a new grocery list
   */
  async createGroceryList(title: string, items: string[], recipeId?: string) {
    try {
      const user = await this.getCurrentUser();
      
      // Categorize items using local categorization for immediate display
      const categorizedItems = items.map(item => ({ 
        name: item, 
        checked: false,
        category: categorizeItemLocally(item)
      }));

      const { data, error } = await supabase
        .from('grocery_lists')
        .insert({
          title,
          items: categorizedItems,
          user_id: user.id,
          recipe_id: recipeId
        })
        .select('*')
        .single();
      
      if (error) {
        return this.handleError(error, "Failed to create grocery list");
      }

      // Update with AI categorization in the background
      setTimeout(() => this.updateItemCategoriesWithAI(data.id, categorizedItems), 100);
      
      return data;
    } catch (error) {
      return this.handleError(error, "Failed to create grocery list");
    }
  }

  /**
   * Update grocery list items
   */
  async updateGroceryListItems(listId: string, items: GroceryItem[]) {
    try {
      // Ensure all items have categories
      const itemsForStorage = items.map(item => {
        if (!item.category) {
          return {
            ...item,
            category: categorizeItemLocally(item.name)
          };
        }
        return item;
      });

      const { error } = await supabase
        .from('grocery_lists')
        .update({ items: itemsForStorage })
        .eq('id', listId);
      
      if (error) {
        return this.handleError(error, "Failed to update grocery list items");
      }
      
      return itemsForStorage;
    } catch (error) {
      return this.handleError(error, "Failed to update grocery list items");
    }
  }

  /**
   * Delete a grocery list
   */
  async deleteGroceryList(listId: string) {
    try {
      const { error } = await supabase
        .from('grocery_lists')
        .delete()
        .eq('id', listId);
      
      if (error) {
        return this.handleError(error, "Failed to delete grocery list");
      }
      
      return true;
    } catch (error) {
      return this.handleError(error, "Failed to delete grocery list");
    }
  }

  /**
   * Update grocery list image
   */
  async updateGroceryListImage(listId: string, imageUrl: string) {
    try {
      const { error } = await supabase
        .from('grocery_lists')
        .update({ image_url: imageUrl })
        .eq('id', listId);
      
      if (error) {
        return this.handleError(error, "Failed to update grocery list image");
      }
      
      return imageUrl;
    } catch (error) {
      return this.handleError(error, "Failed to update grocery list image");
    }
  }

  /**
   * Helper method to update item categories with AI in the background
   */
  private async updateItemCategoriesWithAI(listId: string, items: GroceryItem[]) {
    try {
      // Only process items that don't have a category or are categorized as "Other"
      const itemsToUpdate = items.filter(item => !item.category || item.category === 'Other');
      
      if (itemsToUpdate.length > 0) {
        console.log(`Updating ${itemsToUpdate.length} items with AI categorization`);
        
        const updatedItems = await Promise.all(
          items.map(async (item) => {
            if (!item.category || item.category === 'Other') {
              try {
                const aiCategory = await this.aiService.categorizeGroceryItem(item.name);
                return { ...item, category: aiCategory };
              } catch (error) {
                console.error(`Error getting AI category for ${item.name}:`, error);
                return item;
              }
            }
            return item;
          })
        );
        
        // Only update if categories have changed
        const hasChanges = updatedItems.some((newItem, index) => 
          newItem.category !== items[index].category
        );
        
        if (hasChanges) {
          await this.updateGroceryListItems(listId, updatedItems);
        }
      }
    } catch (error) {
      console.error('Error updating categories with AI:', error);
    }
  }
} 