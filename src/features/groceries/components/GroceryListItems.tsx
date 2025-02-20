import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface GroceryItem {
  name: string;
  checked: boolean;
}

interface GroceryListItemsProps {
  items: GroceryItem[];
  onToggleItem: (item: GroceryItem) => void;
}

export function GroceryListItems({ items, onToggleItem }: GroceryListItemsProps) {
  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Items</h2>
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.name} className="flex items-center space-x-2">
            <Checkbox
              id={item.name}
              checked={item.checked}
              onCheckedChange={() => onToggleItem(item)}
            />
            <Label
              htmlFor={item.name}
              className={`text-lg ${item.checked ? 'line-through text-gray-500' : ''}`}
            >
              {item.name}
            </Label>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-gray-500 italic">No items in this list yet.</p>
        )}
      </div>
    </Card>
  );
} 