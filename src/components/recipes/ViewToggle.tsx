
import { LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ViewToggleProps {
  view: "grid" | "list";
  onViewChange: (view: "grid" | "list") => void;
  className?: string;
}

export function ViewToggle({ view, onViewChange, className }: ViewToggleProps) {
  return (
    <div className={cn("flex items-center border rounded-lg overflow-hidden", className)}>
      <Button
        variant="ghost"
        size="sm"
        className={`h-8 px-3 rounded-none ${
          view === "grid" ? "bg-muted" : "hover:bg-transparent hover:text-foreground"
        }`}
        onClick={() => onViewChange("grid")}
      >
        <LayoutGrid className="h-4 w-4" />
        <span className="sr-only">Grid view</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={`h-8 px-3 rounded-none ${
          view === "list" ? "bg-muted" : "hover:bg-transparent hover:text-foreground"
        }`}
        onClick={() => onViewChange("list")}
      >
        <List className="h-4 w-4" />
        <span className="sr-only">List view</span>
      </Button>
    </div>
  );
}
