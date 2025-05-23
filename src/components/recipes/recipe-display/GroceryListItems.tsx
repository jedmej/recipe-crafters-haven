
import { useState, useMemo, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { TodoItem } from "@/components/ui/to-do-item";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { categorizeItem, categorizeItemLocally } from "@/features/groceries/utils/categorization";
import { Badge } from "@/components/ui/badge";
import { Todo } from "./types";

// Item categories (same as in MasterGroceryList)
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

interface GroceryItem {
  name: string;
  checked: boolean;
  category?: string;
}

interface GroceryListItemsProps {
  items: GroceryItem[];
  onToggleItem: (item: GroceryItem) => void;
}

export function GroceryListItems({ items, onToggleItem }: GroceryListItemsProps) {
  const [showActionsForId, setShowActionsForId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("All Items");
  const [localItems, setLocalItems] = useState<GroceryItem[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const aiProcessedRef = useRef<Set<string>>(new Set());

  // Initialize with local categorization for immediate display
  useEffect(() => {
    console.log("Items received:", items);
    
    // Skip AI categorization if we're already processing
    if (isAIProcessing) {
      console.log("Skipping update while AI is processing");
      return;
    }
    
    // Ensure all items have categories
    const itemsWithCategories = items.map(item => ({
      ...item,
      category: item.category || categorizeItemLocally(item.name)
    }));
    
    setLocalItems(itemsWithCategories);
    
    // Calculate category counts
    const counts = ITEM_CATEGORIES.slice(1).reduce((acc, category) => {
      acc[category] = itemsWithCategories.filter(item => item.category === category && !item.checked).length;
      return acc;
    }, {} as Record<string, number>);
    
    setCategoryCounts(counts);
    
    // Then update with AI categorization in the background, but only for items not already processed
    const updateWithAICategories = async () => {
      // Skip if we're already processing
      if (isAIProcessing) return;
      
      // Find items that need AI categorization (not already processed and either no category or 'Other')
      const itemsToProcess = itemsWithCategories.filter(item => 
        !aiProcessedRef.current.has(item.name) && 
        (!item.category || item.category === 'Other')
      );
      
      if (itemsToProcess.length === 0) {
        console.log("No items need AI categorization");
        return;
      }
      
      try {
        setIsAIProcessing(true);
        console.log(`Processing ${itemsToProcess.length} items with AI`);
        
        const updatedItems = [...itemsWithCategories];
        
        // Process items one by one to avoid overwhelming the API
        for (const item of itemsToProcess) {
          try {
            console.log(`Getting AI category for: ${item.name}`);
            const aiCategory = await categorizeItem(item.name);
            console.log(`AI categorized "${item.name}" as "${aiCategory}"`);
            
            // Mark this item as processed
            aiProcessedRef.current.add(item.name);
            
            // Update the item in our local array
            const index = updatedItems.findIndex(i => i.name === item.name);
            if (index !== -1) {
              updatedItems[index] = { ...updatedItems[index], category: aiCategory };
            }
          } catch (error) {
            console.error(`Error getting AI category for ${item.name}:`, error);
            // Still mark as processed to avoid retrying
            aiProcessedRef.current.add(item.name);
          }
        }
        
        // Update state with all the changes at once
        setLocalItems(updatedItems);
        
        // Update category counts
        const newCounts = ITEM_CATEGORIES.slice(1).reduce((acc, category) => {
          acc[category] = updatedItems.filter(item => item.category === category && !item.checked).length;
          return acc;
        }, {} as Record<string, number>);
        
        setCategoryCounts(newCounts);
        
        // Also update the items in the database via onToggleItem, but only once per item
        const itemsToUpdate = updatedItems.filter((item, index) => 
          item.category !== itemsWithCategories[index].category
        );
        
        if (itemsToUpdate.length > 0) {
          console.log(`Updating ${itemsToUpdate.length} items in database`);
          
          // Update items one by one to avoid race conditions
          for (const item of itemsToUpdate) {
            await onToggleItem({ ...item, checked: item.checked });
          }
        }
      } catch (error) {
        console.error('Error updating with AI categories:', error);
      } finally {
        setIsAIProcessing(false);
      }
    };
    
    updateWithAICategories();
  }, [items, onToggleItem, isAIProcessing]);

  // Filter items by active category
  const filteredItems = useMemo(() => {
    if (activeCategory === "All Items") {
      return localItems;
    }
    return localItems.filter(item => item.category === activeCategory);
  }, [localItems, activeCategory]);

  // Convert to todos format for TodoItem component
  const todos = filteredItems.map((item, index) => ({
    id: index.toString(), // Using string IDs to match the Todo interface
    title: item.name,
    completed: item.checked
  }));

  const handleComplete = (id: string) => {
    const index = parseInt(id, 10);
    const item = filteredItems[index];
    onToggleItem({ ...item, checked: !item.checked });
  };

  const handleDelete = (id: string) => {
    const index = parseInt(id, 10);
    const item = filteredItems[index];
    onToggleItem({ ...item, checked: true });
  };

  return (
    <Card className="overflow-hidden rounded-[48px]">
      <div className="p-6">
        <Tabs defaultValue="All Items" value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="flex w-full overflow-x-auto mb-6">
            {ITEM_CATEGORIES.map(category => (
              <TabsTrigger
                key={category}
                value={category}
                className="whitespace-nowrap"
              >
                {category}
                {category !== "All Items" && categoryCounts[category] > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {categoryCounts[category]}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value={activeCategory} className="mt-0">
            <div className="space-y-2">
              {todos.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  {activeCategory === "All Items" 
                    ? "No items in this list yet." 
                    : `No ${activeCategory} items in this list.`}
                </div>
              ) : (
                todos.map(todo => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    onComplete={() => handleComplete(todo.id)}
                    onDelete={() => handleDelete(todo.id)}
                    showActions={showActionsForId === todo.id}
                    onShowActions={() => setShowActionsForId(todo.id)}
                    onHideActions={() => setShowActionsForId(null)}
                  />
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
}
