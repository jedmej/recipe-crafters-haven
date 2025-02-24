import { Card } from "@/components/ui/card";
import { TodoItem } from "@/components/ui/to-do-item";
import { useState } from "react";

interface GroceryItem {
  name: string;
  checked: boolean;
}

interface GroceryListItemsProps {
  items: GroceryItem[];
  onToggleItem: (item: GroceryItem) => void;
}

export function GroceryListItems({ items, onToggleItem }: GroceryListItemsProps) {
  const [showActionsForId, setShowActionsForId] = useState<number | null>(null);

  // Convert GroceryItem to Todo format
  const todos = items.map((item, index) => ({
    id: index,
    title: item.name,
    completed: item.checked
  }));

  const handleComplete = (id: number) => {
    const item = items[id];
    onToggleItem({ ...item, checked: !item.checked });
  };

  const handleDelete = (id: number) => {
    // Since we don't have a direct delete function in the props,
    // we'll mark the item as completed which will eventually delete the list
    const item = items[id];
    onToggleItem({ ...item, checked: true });
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Items</h2>
      <div className="space-y-4">
        {todos.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onComplete={handleComplete}
            onDelete={handleDelete}
            onShowActions={setShowActionsForId}
            showActions={showActionsForId}
            className="hover:bg-secondary/50 rounded-lg p-2 transition-colors"
          />
        ))}
        {items.length === 0 && (
          <p className="text-gray-500 italic">No items in this list yet.</p>
        )}
      </div>
    </Card>
  );
} 