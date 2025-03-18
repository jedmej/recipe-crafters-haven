import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation("recipes");

  return (
    <div className="flex items-center justify-center rounded-2xl">
      <div className="flex items-center justify-center gap-2 text-center">
        {filteredCount !== totalCount ? (
          <>
            <span className="text-[16px] font-bold text-[#FA8922] font-archivo">{filteredCount}</span>
            <span className="text-[16px] font-archivo text-[#222222]">
              {t("recipeCount.from")}{" "}
            </span>
            <span className="text-[16px] font-bold text-[#FA8922] font-archivo">{totalCount}</span>
            <span className="text-[16px] font-archivo text-[#222222]">
              {t("recipeCount.totalFiltered")}
            </span>
          </>
        ) : (
          <>
            <span className="text-[16px] font-bold text-[#FA8922] font-archivo">{totalCount}</span>
            <span className="text-[16px] font-archivo text-[#222222]">
              {t("recipeCount.total")}
            </span>
          </>
        )}
      </div>
      {hasActiveFilters && (
        <Button
          variant="ghost"
          className="text-[16px] font-archivo font-medium text-[#222222] hover:text-[#FA8922] hover:bg-transparent px-4 py-2 h-auto ml-4"
          onClick={onClearFilters}
        >
          {t("actions.clearFilters")}
        </Button>
      )}
    </div>
  );
} 