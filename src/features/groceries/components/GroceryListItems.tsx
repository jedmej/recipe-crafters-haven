import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { TodoItem } from "@/components/ui/to-do-item";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { categorizeItem } from "../utils/categorization";

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

// Function to categorize items is now imported from utils/categorizeItem

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
  const [showActionsForId, setShowActionsForId] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState("All Items");

  // Assign categories to items if they don't have them already
  const categorizedItems = useMemo(() => {
    return items.map(item => ({
      ...item,
      category: item.category || categorizeItem(item.name)
    }));
  }, [items]);

  // Filter items by active category
  const filteredItems = useMemo(() => {
    if (activeCategory === "All Items") {
      return categorizedItems;
    }
    return categorizedItems.filter(item => item.category === activeCategory);
  }, [categorizedItems, activeCategory]);

  // Convert to todos format for TodoItem component
  const todos = filteredItems.map((item, index) => ({
    id: index,
    title: item.name,
    completed: item.checked
  }));

  const handleComplete = (id: number) => {
    const item = filteredItems[id];
    onToggleItem({ ...item, checked: !item.checked });
  };

  const handleDelete = (id: number) => {
    const item = filteredItems[id];
    onToggleItem({ ...item, checked: true });
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Items</h2>
      
      {/* Add category tabs */}
      <Tabs defaultValue="All Items" value={activeCategory} onValueChange={setActiveCategory} className="mb-4">
        <TabsList className="w-full overflow-x-auto flex">
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
      
      <div className="space-y-4">
        {todos.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onComplete={handleComplete}
            onDelete={handleDelete}
            onShowActions={setShowActionsForId}
            showActions={showActionsForId === todo.id}
            className="hover:bg-secondary/50 rounded-lg p-2 transition-colors"
          />
        ))}
        {todos.length === 0 && (
          <p className="text-gray-500 italic">
            {activeCategory === "All Items"
              ? "No items in this list yet."
              : `No ${activeCategory.toLowerCase()} items in this list.`}
          </p>
        )}
      </div>
    </Card>
  );
} 