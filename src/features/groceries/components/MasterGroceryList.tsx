// src/features/groceries/components/MasterGroceryList.tsx
import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TodoItem } from "@/components/ui/to-do-item";
import { Search, Filter, ChevronDown, ChevronUp, Link as LinkIcon, ExternalLink, Trash2 } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { categorizeItem, categorizeItemLocally } from "../utils/categorization";
import { Link } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";

// Item categories for organization
const ITEM_CATEGORIES = [
  "All Items",
  "Produce",
  "Dairy",
  "Meat",
  "Pantry",
  "Spices",
  "Frozen",
  "Baking",
  "Canned",
  "Beverages",
  "Other"
];

export function MasterGroceryList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All Items");
  const [viewMode, setViewMode] = useState("category"); // "category" or "recipe"
  const [showActionsForId, setShowActionsForId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch all grocery lists
  const { data: lists, isLoading } = useQuery({
    queryKey: ['allGroceryLists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('grocery_lists')
        .select(`
          *,
          recipe:recipes (
            id,
            title
          )
        `);
      
      if (error) throw error;
      return data;
    }
  });

  // Update item mutation
  const updateItem = useMutation({
    mutationFn: async ({ listId, itemName, isChecked }: { listId: string, itemName: string, isChecked: boolean }) => {
      // First get the current list
      const { data: list, error: fetchError } = await supabase
        .from('grocery_lists')
        .select('items')
        .eq('id', listId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Update the specific item
      const updatedItems = (list.items as any[]).map(item => {
        const itemObj = typeof item === 'string' ? { name: item, checked: false } : item;
        if (itemObj.name === itemName) {
          return { 
            ...itemObj, 
            checked: isChecked,
            // Keep existing category or use local categorization for immediate update
            category: itemObj.category || categorizeItemLocally(itemName)
          };
        }
        return itemObj;
      });
      
      // Update the list
      const { error: updateError } = await supabase
        .from('grocery_lists')
        .update({ items: updatedItems })
        .eq('id', listId);
      
      if (updateError) throw updateError;
      
      // After updating with local categorization, try to get AI categorization
      setTimeout(async () => {
        try {
          // Find items that might benefit from AI categorization
          const itemsToUpdate = updatedItems.filter(item => 
            !item.category || item.category === 'Other'
          );
          
          if (itemsToUpdate.length > 0) {
            // Get AI categories for these items
            const updatedCategories = await Promise.all(
              itemsToUpdate.map(async (item) => {
                try {
                  const aiCategory = await categorizeItem(item.name);
                  return { name: item.name, category: aiCategory };
                } catch (error) {
                  console.error(`Error getting AI category for ${item.name}:`, error);
                  return null;
                }
              })
            );
            
            // Filter out failed categorizations
            const validUpdates = updatedCategories.filter(Boolean);
            
            if (validUpdates.length > 0) {
              // Apply the AI categories to the items
              const aiUpdatedItems = updatedItems.map(item => {
                const aiUpdate = validUpdates.find(update => update?.name === item.name);
                if (aiUpdate) {
                  return { ...item, category: aiUpdate.category };
                }
                return item;
              });
              
              // Update the database with AI categories
              await supabase
                .from('grocery_lists')
                .update({ items: aiUpdatedItems })
                .eq('id', listId);
                
              // Update the cache
              queryClient.invalidateQueries({ queryKey: ['allGroceryLists'] });
            }
          }
        } catch (error) {
          console.error('Error updating with AI categories:', error);
        }
      }, 100);
      
      return { listId, itemName, isChecked };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allGroceryLists'] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update item: " + error.message,
      });
    }
  });

  // Add a new mutation for removing all items from a recipe
  const removeRecipeItems = useMutation({
    mutationFn: async ({ listId }: { listId: string }) => {
      const { error } = await supabase
        .from('grocery_lists')
        .delete()
        .eq('id', listId);
      
      if (error) throw error;
      
      return { listId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allGroceryLists'] });
      toast({
        title: "Success",
        description: "Recipe items removed from grocery list",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove items: " + error.message,
      });
    }
  });

  // Create a flat list of all grocery items
  const allItems = useMemo(() => {
    if (!lists) return [];
    
    return lists.flatMap(list => {
      const items = Array.isArray(list.items) ? list.items : [];
      return items.map(item => {
        const itemName = typeof item === 'string' ? item : item.name;
        const isChecked = typeof item === 'object' ? item.checked : false;
        
        return {
          id: `${list.id}-${itemName}`,
          name: itemName,
          category: typeof item === 'object' && item.category 
            ? item.category 
            : categorizeItemLocally(itemName),
          listId: list.id,
          listTitle: list.title,
          recipeId: list.recipe?.id,
          recipeTitle: list.recipe?.title,
          checked: isChecked
        };
      });
    });
  }, [lists]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (!allItems.length) return null;
    
    const totalItems = allItems.length;
    const checkedItems = allItems.filter(item => item.checked).length;
    const categoryBreakdown = allItems.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalItems,
      checkedItems,
      categoryBreakdown
    };
  }, [allItems]);

  // Filter items based on search and category
  const filteredItems = useMemo(() => {
    if (!allItems.length) return [];
    
    return allItems.filter(item => {
      // Search filter
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Category filter - only apply if not "All Items"
      const matchesCategory = activeCategory === "All Items" || item.category === activeCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [allItems, searchTerm, activeCategory]);

  // Group items by category or recipe for display and sort them (unchecked first, then checked)
  const groupedItems = useMemo(() => {
    if (!filteredItems.length) return {};
    
    // Helper function to sort items (unchecked first, then checked)
    const sortItems = (items) => {
      return [...items].sort((a, b) => {
        // First sort by checked status (unchecked first)
        if (a.checked !== b.checked) {
          return a.checked ? 1 : -1;
        }
        // Then sort alphabetically by name
        return a.name.localeCompare(b.name);
      });
    };
    
    if (viewMode === "category") {
      // Group by category, then sort within each category
      const grouped = filteredItems.reduce((acc, item) => {
        const category = item.category;
        if (!acc[category]) acc[category] = [];
        acc[category].push(item);
        return acc;
      }, {});
      
      // Sort items within each category
      Object.keys(grouped).forEach(category => {
        grouped[category] = sortItems(grouped[category]);
      });
      
      return grouped;
    } else {
      // Group by recipe, then sort within each recipe
      const grouped = filteredItems.reduce((acc, item) => {
        const recipeKey = item.recipeTitle || item.listTitle || "Uncategorized";
        if (!acc[recipeKey]) acc[recipeKey] = [];
        acc[recipeKey].push(item);
        return acc;
      }, {});
      
      // Sort items within each recipe
      Object.keys(grouped).forEach(recipe => {
        grouped[recipe] = sortItems(grouped[recipe]);
      });
      
      return grouped;
    }
  }, [filteredItems, viewMode]);

  // Handle checkbox click
  const handleToggleItem = (item) => {
    updateItem.mutate({
      listId: item.listId,
      itemName: item.name,
      isChecked: !item.checked
    }, {
      onSuccess: () => {
        // Check if all items in this recipe are now checked
        if (!item.checked) { // Only check when marking as checked
          setTimeout(() => {
            const currentList = queryClient.getQueryData(['allGroceryLists']) as any[];
            if (currentList) {
              const list = currentList.find(l => l.id === item.listId);
              if (list && list.items) {
                const allChecked = list.items.every(i => 
                  typeof i === 'string' ? false : i.checked
                );
                
                if (allChecked) {
                  // All items are checked, remove the recipe
                  removeRecipeItems.mutate({ listId: item.listId });
                }
              }
            }
          }, 100); // Small delay to ensure the query cache is updated
        }
      }
    });
  };

  // Handle removing all items from a recipe
  const handleRemoveRecipe = (listId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent accordion from toggling
    removeRecipeItems.mutate({ listId });
  };

  // Switch to "All Items" if the current category has 0 items
  useEffect(() => {
    if (summaryStats && 
        activeCategory !== "All Items" && 
        (!summaryStats.categoryBreakdown[activeCategory] || 
         summaryStats.categoryBreakdown[activeCategory] === 0)) {
      setActiveCategory("All Items");
    }
  }, [summaryStats, activeCategory]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  // Render the master grocery list with tabs for different views
  return (
    <Card className="overflow-hidden rounded-[48px]">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Master Grocery List</span>
          {summaryStats && (
            <span className="text-sm font-normal text-muted-foreground">
              {summaryStats.checkedItems}/{summaryStats.totalItems} items checked
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!lists?.length ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">You don't have any grocery lists yet.</p>
            <Button asChild>
              <Link to="/recipes">Browse Recipes</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "category" ? "default" : "outline"}
                  onClick={() => setViewMode("category")}
                  className="whitespace-nowrap"
                >
                  By Category
                </Button>
                <Button
                  variant={viewMode === "recipe" ? "default" : "outline"}
                  onClick={() => setViewMode("recipe")}
                  className="whitespace-nowrap"
                >
                  By Recipe
                </Button>
              </div>
            </div>

            {/* Category Tabs - only shown when in category view */}
            {viewMode === "category" && (
              <div className="mb-4 overflow-x-auto">
                <Tabs value={activeCategory} onValueChange={setActiveCategory}>
                  <TabsList className="flex w-full overflow-x-auto">
                    {ITEM_CATEGORIES.map(category => {
                      // Skip categories with 0 items, except "All Items"
                      if (category !== "All Items" && 
                          summaryStats && 
                          (!summaryStats.categoryBreakdown[category] || 
                           summaryStats.categoryBreakdown[category] === 0)) {
                        return null;
                      }
                      
                      return (
                        <TabsTrigger
                          key={category}
                          value={category}
                          className="whitespace-nowrap"
                        >
                          {category}
                          {summaryStats && (
                            <span className="ml-1 text-xs bg-primary/10 text-white rounded-full px-1.5 py-0.5">
                              {category === "All Items" 
                                ? summaryStats.totalItems 
                                : summaryStats.categoryBreakdown[category] || 0}
                            </span>
                          )}
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                </Tabs>
              </div>
            )}

            {/* Grouped Items */}
            <div className="space-y-4">
              {Object.keys(groupedItems).length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">No items match your search.</p>
                </div>
              ) : (
                Object.entries(groupedItems).map(([groupName, items]) => (
                  <div key={groupName} className="rounded-[24px] overflow-hidden bg-[#FFF] p-[24px]">
                    <Accordion type="single" collapsible defaultValue={groupName}>
                      <AccordionItem value={groupName} className="border-0">
                        <AccordionTrigger className="px-4 py-2 hover:no-underline hover:bg-muted/50">
                          <div className="flex items-center justify-between w-full">
                            <span className="font-medium">{groupName}</span>
                            <div className="flex items-center gap-2">
                              {viewMode === "recipe" && (
                                <>
                                  {(items as any[])[0]?.recipeId && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      asChild
                                      className="h-7 px-2"
                                      title={`View recipe: ${groupName}`}
                                    >
                                      <Link to={`/recipes/${(items as any[])[0].recipeId}`}>
                                        <ExternalLink className="h-4 w-4 mr-1" />
                                        <span className="sr-only">View Recipe</span>
                                      </Link>
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    title={`Remove all items from ${groupName}`}
                                    onClick={(e) => handleRemoveRecipe((items as any[])[0].listId, e)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Remove All Items</span>
                                  </Button>
                                </>
                              )}
                              <span className="text-sm text-muted-foreground">
                                {(items as any[]).filter(i => !i.checked).length}/{(items as any[]).length} remaining
                              </span>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="divide-y">
                            {(items as any[]).map((item) => (
                              <div key={item.id} className="px-4 py-2">
                                <TodoItem
                                  todo={{
                                    id: item.id,
                                    title: item.name,
                                    completed: item.checked
                                  }}
                                  onComplete={() => handleToggleItem(item)}
                                  onDelete={() => handleToggleItem(item)}
                                  showActions={showActionsForId === item.id}
                                  onShowActions={() => setShowActionsForId(item.id)}
                                  onHideActions={() => setShowActionsForId(null)}
                                />
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}