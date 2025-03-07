// src/features/groceries/components/MasterGroceryList.tsx
import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TodoItem } from "@/components/ui/to-do-item";
import { Search, Filter, ChevronDown, ChevronUp, Link as LinkIcon } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { categorizeItem } from "../utils/categorization";
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
    mutationFn: async ({ listId, itemName, isChecked }: { listId: string; itemName: string; isChecked: boolean }) => {
      // First, get the current list to update the correct item
      const { data, error: fetchError } = await supabase
        .from('grocery_lists')
        .select('items')
        .eq('id', listId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Update the specific item in the items array
      const updatedItems = Array.isArray(data.items) 
        ? data.items.map(item => {
            const itemData = typeof item === 'string' 
              ? { name: item, checked: false } 
              : item;
              
            if (itemData.name === itemName) {
              return {
                ...itemData,
                checked: isChecked
              };
            }
            return itemData;
          })
        : [];
      
      // Save the updated items back to the database
      const { error: updateError } = await supabase
        .from('grocery_lists')
        .update({ items: updatedItems })
        .eq('id', listId);
      
      if (updateError) throw updateError;
      
      return { listId, itemName, isChecked };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allGroceryLists'] });
      toast({
        title: "Item updated",
        description: "Item status has been updated successfully."
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update item: " + error.message
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
          category: categorizeItem(itemName),
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
      
      // Category filter
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
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  // Render the master grocery list with tabs for different views
  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle>Master Grocery List</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Summary Statistics */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Card className="p-3 flex-1 min-w-[120px]">
            <CardContent className="p-0 text-center">
              <p className="text-sm text-muted-foreground">Total Items</p>
              <p className="text-2xl font-bold">{summaryStats?.totalItems || 0}</p>
            </CardContent>
          </Card>
          <Card className="p-3 flex-1 min-w-[120px]">
            <CardContent className="p-0 text-center">
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold">{summaryStats?.checkedItems || 0}</p>
            </CardContent>
          </Card>
          <Card className="p-3 flex-1 min-w-[120px]">
            <CardContent className="p-0 text-center">
              <p className="text-sm text-muted-foreground">Lists</p>
              <p className="text-2xl font-bold">{lists?.length || 0}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter Bar */}
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
            <Tabs defaultValue="All Items" value={activeCategory} onValueChange={setActiveCategory}>
              <TabsList className="flex w-full overflow-x-auto">
                {ITEM_CATEGORIES.map(category => (
                  <TabsTrigger
                    key={category}
                    value={category}
                    className="whitespace-nowrap"
                  >
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        )}

        {/* Grouped Items */}
        <div className="space-y-6">
          {viewMode === "category" ? (
            // Category View
            Object.entries(groupedItems).map(([group, items]) => (
              <div key={group} className="space-y-2">
                <h3 className="font-medium text-lg">{group}</h3>
                <div className="bg-gray-50 rounded-md p-3">
                  {items.map((item) => (
                    <div key={item.id} className="py-2 border-b last:border-b-0 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={() => handleToggleItem(item)}
                          className="rounded cursor-pointer"
                        />
                        <span className={item.checked ? "line-through text-gray-400" : ""}>
                          {item.name}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.listTitle}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            // Recipe View with Accordion
            <Accordion type="multiple" className="space-y-4">
              {Object.entries(groupedItems).map(([group, items]) => (
                <AccordionItem key={group} value={group} className="border rounded-md overflow-hidden bg-gray-50 border-gray-200 mb-4 last:mb-0">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-gray-100">
                    <div className="flex items-center">
                      {items[0].recipeId ? (
                        <Link 
                          to={`/recipes/${items[0].recipeId}`} 
                          className="text-primary hover:underline flex items-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="font-medium text-lg">{group}</span>
                          <LinkIcon className="ml-2 h-4 w-4" />
                        </Link>
                      ) : (
                        <span className="font-medium text-lg">{group}</span>
                      )}
                      <span className="ml-2 text-xs text-gray-500">
                        ({items.length} items)
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 bg-white">
                    <div className="space-y-2">
                      {items.map((item) => (
                        <div key={item.id} className="py-2 border-b last:border-b-0 flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={item.checked}
                              onChange={() => handleToggleItem(item)}
                              className="rounded cursor-pointer"
                            />
                            <span className={item.checked ? "line-through text-gray-400" : ""}>
                              {item.name}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.category}
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}

          {Object.keys(groupedItems).length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? "No matching items found." : "No grocery items found."}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}