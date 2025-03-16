import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Grid, List } from "lucide-react";
import { cn } from "@/lib/utils";

interface ViewToggleProps {
  view: "grid" | "list";
  onViewChange: (view: "grid" | "list") => void;
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <ToggleGroup
      type="single"
      value={view}
      onValueChange={(value) => {
        if (value === "grid" || value === "list") {
          onViewChange(value);
        }
      }}
      className="border rounded-full p-1 bg-white"
    >
      <ToggleGroupItem 
        value="grid" 
        className={cn(
          "rounded-full transition-colors",
          "data-[state=on]:bg-[#222222]",
          "data-[state=on]:text-white",
          "data-[state=off]:text-[#222222]"
        )}
      >
        <Grid className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem 
        value="list" 
        className={cn(
          "rounded-full transition-colors",
          "data-[state=on]:bg-[#222222]",
          "data-[state=on]:text-white",
          "data-[state=off]:text-[#222222]"
        )}
      >
        <List className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
} 