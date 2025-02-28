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
    <div className="flex items-center justify-center rounded-2xl">
      <div className="flex items-center justify-center gap-2 text-center">
        <span className="text-[16px] font-bold text-[#FA8922] font-archivo">
          {filteredCount}
        </span>
        <span className="text-[16px] font-archivo text-[#222222]">
          {filteredCount !== totalCount ? (
            <>
              filtered from{" "}
              <span className="text-[16px] font-bold text-[#FA8922] font-archivo">
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
          className="text-[16px] font-archivo font-medium text-[#222222] hover:text-[#FA8922] hover:bg-transparent px-4 py-2 h-auto ml-4"
          onClick={onClearFilters}
        >
          Clear all filters
        </Button>
      )}
    </div>
  );
} 