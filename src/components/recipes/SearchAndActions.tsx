import { Input } from "@/components/ui/input";
import { Search, Trash, X } from "lucide-react";
import { Sliders, Checks } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { ActionButton } from "./ActionButton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface SearchAndActionsProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isSelectionMode: boolean;
  toggleSelectionMode: () => void;
  selectedRecipes: string[];
  handleDeleteSelected: () => void;
  isFiltersVisible: boolean;
  setIsFiltersVisible: (visible: boolean) => void;
  activeFilterCount: number;
}

export function SearchAndActions({
  searchTerm,
  setSearchTerm,
  isSelectionMode,
  toggleSelectionMode,
  selectedRecipes,
  handleDeleteSelected,
  isFiltersVisible,
  setIsFiltersVisible,
  activeFilterCount
}: SearchAndActionsProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-[32px] font-bold font-judson text-[#222222]">My recipes</h1>
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setIsFiltersVisible(!isFiltersVisible)}
            className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors"
          >
            <Sliders 
              size={20} 
              weight="regular" 
              className={isFiltersVisible ? "text-[#FA8922]" : "text-[#222222]"}
            />
          </button>

          <button
            onClick={toggleSelectionMode}
            className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors"
          >
            {isSelectionMode ? (
              <X className="h-5 w-5 text-[#FA8922]" />
            ) : (
              <Checks size={20} weight="regular" className="text-[#222222]" />
            )}
          </button>

          {isSelectionMode && selectedRecipes.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors">
                  <Trash className="h-5 w-5 text-[#FA8922]" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the selected recipes.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteSelected}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative w-full">
        <div className="relative flex items-center w-full h-12 bg-white rounded-full shadow-sm">
          <Search className="absolute left-4 h-5 w-5 text-[#222222] opacity-30" />
          <Input
            type="search"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-full pl-12 pr-4 border-none rounded-full text-sm font-archivo placeholder:text-[#222222] placeholder:opacity-30 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
      </div>
    </div>
  );
} 