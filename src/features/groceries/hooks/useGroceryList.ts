
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';
import { categorizeItem, categorizeItemLocally } from '../utils/categorization';
import { GroceryItem, GroceryList } from '../types';

export function useGroceryList(id: string | undefined) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: list, isLoading } = useQuery({
    queryKey: ['groceryLists', id],
    queryFn: async () => {
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
      
      if (error) throw error;

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

      const result = { ...data, items } as GroceryList;
      
      // Then, update categories with AI in the background
      setTimeout(async () => {
        try {
          // Only process items that don't have a category or are categorized as "Other"
          const itemsToUpdate = items.filter(item => !item.category || item.category === 'Other');
          
          if (itemsToUpdate.length > 0) {
            console.log(`Updating ${itemsToUpdate.length} items with AI categorization`);
            
            const updatedItems = await Promise.all(
              items.map(async (item) => {
                if (!item.category || item.category === 'Other') {
                  try {
                    const aiCategory = await categorizeItem(item.name);
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
              console.log("Categories updated with AI:", updatedItems);
              
              // Update the query cache with AI-categorized items
              queryClient.setQueryData(['groceryLists', id], {
                ...result,
                items: updatedItems
              });
              
              // Also update the database
              await updateItems.mutateAsync(updatedItems);
            }
          }
        } catch (error) {
          console.error('Error updating categories with AI:', error);
        }
      }, 100);

      return result;
    },
    staleTime: 30000, // Cache for 30 seconds to prevent flickering during navigation
  });

  const updateItems = useMutation({
    mutationFn: async (items: GroceryItem[]) => {
      // Ensure all items have categories
      const itemsForStorage = await Promise.all(items.map(async (item) => {
        if (!item.category) {
          // Try AI categorization first, fall back to local if it fails
          try {
            const aiCategory = await categorizeItem(item.name);
            return {
              ...item,
              category: aiCategory
            };
          } catch (error) {
            console.warn('AI categorization failed, using local fallback:', error);
            return {
              ...item,
              category: categorizeItemLocally(item.name)
            };
          }
        }
        return item;
      }));

      // Cast to any to work around the Json type constraints
      const { error } = await supabase
        .from('grocery_lists')
        .update({ items: itemsForStorage as any })
        .eq('id', id);
      
      if (error) throw error;
      
      return itemsForStorage;
    },
    onSuccess: (updatedItems) => {
      // Update the cache with the new items
      queryClient.setQueryData(['groceryLists', id], (oldData: GroceryList | undefined) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          items: updatedItems
        };
      });
      
      // Also invalidate the query to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['groceryLists', id] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update items: " + error.message,
      });
    }
  });

  const deleteList = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('grocery_lists')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groceryLists'] });
      navigate('/grocery-lists');
      toast({
        title: "Success",
        description: "Your grocery list has been deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  });

  const updateImage = useMutation({
    mutationFn: async (imageUrl: string) => {
      const { error } = await supabase
        .from('grocery_lists')
        .update({ image_url: imageUrl })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groceryLists', id] });
      toast({
        title: "Success",
        description: "List image has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  });

  const toggleItem = async (itemToToggle: GroceryItem) => {
    if (!list) return;

    // Find the item in the list and update it
    const newItems = list.items.map(item => 
      item.name === itemToToggle.name 
        ? { 
            ...itemToToggle, // Use the entire itemToToggle to preserve category
            checked: !item.checked
          }
        : item
    );

    // Update the UI immediately
    queryClient.setQueryData(['groceryLists', id], {
      ...list,
      items: newItems
    });

    // Then update the database
    await updateItems.mutateAsync(newItems);

    // Check if all items are checked
    const allChecked = newItems.every(item => item.checked);
    if (allChecked) {
      setTimeout(() => {
        toast({
          title: "List Completed",
          description: "All items have been checked off. The list will be deleted.",
        });
        deleteList.mutate();
      }, 1500);
    }
  };

  // Add a new method to add an item with automatic categorization
  const addItem = async (itemName: string) => {
    if (!list || !itemName.trim()) return;

    // First use local categorization for immediate feedback
    const localCategory = categorizeItemLocally(itemName.trim());
    
    const newItem: GroceryItem = {
      name: itemName.trim(),
      checked: false,
      category: localCategory
    };

    const newItems = [...list.items, newItem];

    // Update UI immediately with local categorization
    queryClient.setQueryData(['groceryLists', id], {
      ...list,
      items: newItems
    });

    // Then get AI categorization and update if different
    try {
      const aiCategory = await categorizeItem(itemName.trim());
      
      if (aiCategory !== localCategory) {
        const updatedItems = newItems.map(item => 
          item.name === itemName.trim() 
            ? { ...item, category: aiCategory }
            : item
        );
        
        queryClient.setQueryData(['groceryLists', id], {
          ...list,
          items: updatedItems
        });
        
        await updateItems.mutateAsync(updatedItems);
      } else {
        // If categories match, still save the original update
        await updateItems.mutateAsync(newItems);
      }
    } catch (error) {
      // If AI categorization fails, still save with local categorization
      console.error('Error getting AI category:', error);
      await updateItems.mutateAsync(newItems);
    }
  };

  // Add a recategorize function to categorize all items with AI
  const recategorizeItems = async () => {
    console.log("Recategorize button clicked");
    
    if (!list) {
      console.error("Cannot recategorize: list is undefined");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Cannot recategorize items: list not found",
      });
      return;
    }
    
    if (!list.items || list.items.length === 0) {
      toast({
        variant: "destructive",
        title: "No items to categorize",
        description: "This grocery list doesn't have any items to categorize.",
      });
      return;
    }
    
    console.log(`Recategorizing ${list.items.length} items`);
    
    // Show a toast to indicate the process has started
    toast({
      title: "Recategorizing items",
      description: "Using AI to categorize all items in your grocery list...",
    });

    try {
      // Create a copy of the items to work with
      const itemsCopy = [...list.items];
      const updatedItems: GroceryItem[] = [];
      let recategorizedCount = 0;
      
      // Process items one by one to avoid overwhelming the API
      for (const item of itemsCopy) {
        console.log(`Processing item: ${item.name}`);
        try {
          const aiCategory = await categorizeItem(item.name);
          console.log(`Item "${item.name}" categorized as "${aiCategory}"`);
          
          // Check if the category changed
          if (item.category !== aiCategory) {
            recategorizedCount++;
          }
          
          // Add the updated item to our array
          updatedItems.push({ ...item, category: aiCategory });
        } catch (error) {
          console.error(`Error getting AI category for ${item.name}:`, error);
          // Fall back to local categorization if AI fails
          const localCategory = categorizeItemLocally(item.name);
          console.log(`Fallback: Item "${item.name}" categorized locally as "${localCategory}"`);
          
          // Check if the category changed
          if (item.category !== localCategory && item.category !== "Other") {
            recategorizedCount++;
          }
          
          // Add the item with local category to our array
          updatedItems.push({ 
            ...item, 
            category: item.category !== "Other" ? item.category : localCategory 
          });
        }
      }
      
      console.log(`${recategorizedCount} items were recategorized`);
      
      if (recategorizedCount === 0) {
        toast({
          title: "No changes needed",
          description: "All items already have the correct categories.",
        });
        return;
      }
      
      console.log("All items processed, updating UI and database");
      
      // Update the UI immediately
      queryClient.setQueryData(['groceryLists', id], {
        ...list,
        items: updatedItems
      });
      
      // Then update the database with a single mutation to avoid loops
      await supabase
        .from('grocery_lists')
        .update({ items: updatedItems as any })
        .eq('id', id);
      
      // Invalidate the query to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['groceryLists', id] });
      
      toast({
        title: "Success",
        description: `${recategorizedCount} items have been recategorized with AI.`,
      });
    } catch (error) {
      console.error('Error recategorizing items:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to recategorize items: " + (error instanceof Error ? error.message : String(error)),
      });
    }
  };

  return {
    list,
    isLoading,
    deleteList,
    updateImage,
    toggleItem,
    addItem,
    updateItems,
    recategorizeItems
  };
} 
