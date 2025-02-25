import { Input } from "@/components/ui/input";
import { Search, Filter, Trash, X } from "lucide-react";
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
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search Bar */}
      <div className="relative flex-1">
        <Input
          type="search"
          placeholder="Search recipes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-5 pr-12 h-12 sm:h-14 text-base sm:text-lg bg-white border-none shadow-sm rounded-2xl"
        />
        <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
      </div>
      
      {/* Action Buttons */}
      <div className="flex gap-3">
        <ActionButton
          label="Filters"
          icon={Filter}
          onClick={() => setIsFiltersVisible(!isFiltersVisible)}
          active={isFiltersVisible}
          badgeCount={activeFilterCount}
        />

        <ActionButton
          label={isSelectionMode ? "Cancel Selection" : "Select Multiple"}
          icon={isSelectionMode ? X : Filter}
          onClick={toggleSelectionMode}
          active={isSelectionMode}
        />

        {isSelectionMode && selectedRecipes.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                className="h-12 sm:h-14 px-4 sm:px-6 rounded-2xl shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <Trash className="h-5 w-5" />
                  <span>Delete ({selectedRecipes.length})</span>
                </div>
              </Button>
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
  );
} 