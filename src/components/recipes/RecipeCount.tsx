import { Button } from "@/components/ui/button";

interface RecipeCountProps {
  filteredCount: number;
  totalCount: number;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export function RecipeCount({ 
  filteredCount, 
  totalCount, 
  hasActiveFilters, 
  onClearFilters 
}: RecipeCountProps) {
  return (
    <div className="flex items-center justify-center bg-white shadow-sm rounded-2xl px-6 py-4">
      <div className="flex items-center gap-2">
        <span className="text-2xl font-semibold text-gray-900">
          {filteredCount}
        </span>
        <span className="text-lg text-gray-500">
          {filteredCount !== totalCount ? (
            <>
              filtered from{" "}
              <span className="text-lg font-semibold text-gray-900">
                {totalCount}
              </span>{" "}
              total recipes
            </>
          ) : (
            "total recipes"
          )}
        </span>
      </div>
      {hasActiveFilters && (
        <Button
          variant="ghost"
          className="text-base font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 px-4 py-2 h-auto"
          onClick={onClearFilters}
        >
          Clear all filters
        </Button>
      )}
    </div>
  );
} 