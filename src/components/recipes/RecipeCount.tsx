
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface RecipeCountProps {
  filteredCount: number;
  totalCount: number;
  hasActiveFilters: boolean;
  onClearFilters?: () => void;
}

export function RecipeCount({
  filteredCount,
  totalCount,
  hasActiveFilters,
  onClearFilters,
}: RecipeCountProps) {
  return (
    <div className="flex items-center gap-2">
      <p className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{filteredCount}</span>
        {filteredCount !== totalCount && (
          <> of <span className="font-medium text-foreground">{totalCount}</span></>
        )}{" "}
        recipes
      </p>

      {hasActiveFilters && onClearFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="h-7 px-2 text-xs gap-1"
        >
          <X className="h-3.5 w-3.5" />
          <span>Clear filters</span>
        </Button>
      )}
    </div>
  );
}
