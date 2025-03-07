import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Plus, Loader2, List, Search, Link as LinkIcon, Trash, Filter, Calendar, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import { format, subDays, isAfter } from "date-fns";
import { MasterGroceryList } from "@/features/groceries/components/MasterGroceryList";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type GroceryList = Database['public']['Tables']['grocery_lists']['Row'] & {
  recipe?: {
    id: string;
    title: string;
    image_url: string;
  } | null;
};

// Time periods for filter
const TIME_PERIODS = ["All time", "Last week", "Last month"];

export default function GroceryListsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Selection state
  const [selectedLists, setSelectedLists] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  
  // Filter state
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  const [timePeriodFilter, setTimePeriodFilter] = useState("All time");
  const [hasRecipeFilter, setHasRecipeFilter] = useState<boolean | null>(null);
  const [itemCountRange, setItemCountRange] = useState<number[]>([0, 100]);

  const { data: lists, isLoading } = useQuery({
    queryKey: ['groceryLists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('grocery_lists')
        .select(`
          *,
          recipe:recipes (
            id,
            title,
            image_url
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as GroceryList[];
    }
  });

  // Delete mutation
  const deleteLists = useMutation({
    mutationFn: async (listIds: string[]) => {
      const { error } = await supabase
        .from('grocery_lists')
        .delete()
        .in('id', listIds);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groceryLists'] });
      setSelectedLists([]);
      setIsSelectionMode(false);
      toast({
        title: "Lists deleted",
        description: "Selected grocery lists have been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  });

  // Filter functions
  const getActiveFilterCount = () => {
    let count = 0;
    if (timePeriodFilter !== "All time") count++;
    if (hasRecipeFilter !== null) count++;
    if (itemCountRange[0] !== 0 || itemCountRange[1] !== 100) count++;
    return count;
  };

  // Time filter helper function
  const isWithinTimePeriod = (createdAt: string | null) => {
    if (!createdAt) return true;
    
    const date = new Date(createdAt);
    
    if (timePeriodFilter === "Last week") {
      return isAfter(date, subDays(new Date(), 7));
    }
    if (timePeriodFilter === "Last month") {
      return isAfter(date, subDays(new Date(), 30));
    }
    return true; // "All time"
  };

  // Apply filters to lists
  const filteredLists = lists?.filter(list => {
    // Text search filter
    const matchesSearch = list.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Time period filter
    const matchesTimePeriod = isWithinTimePeriod(list.created_at);
    
    // Has recipe filter
    const matchesRecipeFilter = 
      hasRecipeFilter === null || 
      (hasRecipeFilter === true && list.recipe) || 
      (hasRecipeFilter === false && !list.recipe);
    
    // Item count filter
    const itemCount = Array.isArray(list.items) ? list.items.length : 0;
    const matchesItemCount = itemCount >= itemCountRange[0] && itemCount <= itemCountRange[1];
    
    return matchesSearch && matchesTimePeriod && matchesRecipeFilter && matchesItemCount;
  });

  // Selection functions
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      setSelectedLists([]);
    }
  };

  const handleCardClick = (listId: string, event: React.MouseEvent) => {
    if (isSelectionMode) {
      toggleListSelection(listId);
    } else {
      navigate(`/grocery-lists/${listId}`);
    }
  };

  const toggleListSelection = (listId: string) => {
    setSelectedLists(prev => {
      const newSelection = prev.includes(listId)
        ? prev.filter(id => id !== listId)
        : [...prev, listId];
      
      if (newSelection.length === 0) {
        setIsSelectionMode(false);
      }
      
      return newSelection;
    });
  };

  const handleDeleteSelected = () => {
    deleteLists.mutate(selectedLists);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Reset all filters
  const resetFilters = () => {
    setTimePeriodFilter("All time");
    setHasRecipeFilter(null);
    setItemCountRange([0, 100]);
    setSearchTerm("");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            My Grocery Lists
          </h1>
        </header>

        {/* Add the MasterGroceryList component here */}
        <MasterGroceryList />

        {/* Search and Controls Section */}
        <div className="flex flex-col gap-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Input
                type="search"
                placeholder="Search lists..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-5 pr-12 h-12 sm:h-14 text-base sm:text-lg bg-white border-none shadow-sm rounded-2xl"
              />
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button 
                onClick={() => navigate("/grocery-lists/new")} 
                className="h-12 sm:h-14 px-4 sm:px-6 rounded-2xl gap-2 bg-gray-900 hover:bg-gray-800"
              >
                <Plus className="h-4 w-4" />
                New List
              </Button>
              
              <Button
                variant="outline"
                className={cn(
                  "h-12 sm:h-14 px-4 sm:px-6 rounded-2xl border-none shadow-sm bg-white hover:bg-gray-50",
                  isFiltersVisible && "bg-gray-100 hover:bg-gray-100"
                )}
                onClick={() => setIsFiltersVisible(!isFiltersVisible)}
              >
                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  <span className="font-medium">Filters</span>
                  {getActiveFilterCount() > 0 && (
                    <div className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium">
                      {getActiveFilterCount()}
                    </div>
                  )}
                </div>
              </Button>

              <Button
                variant="outline"
                className={cn(
                  "h-12 sm:h-14 px-4 sm:px-6 rounded-2xl border-none shadow-sm bg-white hover:bg-gray-50",
                  isSelectionMode && "bg-gray-100 hover:bg-gray-100"
                )}
                onClick={toggleSelectionMode}
              >
                {isSelectionMode ? "Cancel Selection" : "Select Multiple"}
              </Button>

              {isSelectionMode && selectedLists.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      className="h-12 sm:h-14 px-4 sm:px-6 rounded-2xl shadow-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Trash className="h-5 w-5" />
                        <span>Delete ({selectedLists.length})</span>
                      </div>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the selected grocery lists.
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

          {/* List Count */}
          <div className="flex items-center justify-center bg-white shadow-sm rounded-2xl px-6 py-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-semibold text-gray-900">
                {filteredLists?.length}
              </span>
              <span className="text-lg text-gray-500">
                {filteredLists?.length !== lists?.length ? (
                  <>
                    filtered from{" "}
                    <span className="text-lg font-semibold text-gray-900">
                      {lists?.length}
                    </span>{" "}
                    total lists
                  </>
                ) : (
                  "total lists"
                )}
              </span>
            </div>
            {getActiveFilterCount() > 0 && (
              <Button
                variant="ghost"
                className="text-base font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 px-4 py-2 h-auto"
                onClick={resetFilters}
              >
                Clear all filters
              </Button>
            )}
          </div>

          {/* Filter Panel */}
          {isFiltersVisible && (
            <div className="bg-white shadow-sm rounded-2xl p-6 space-y-6 animate-in slide-in-from-top-2 duration-200">
              {/* Time Period Filter */}
              <div className="space-y-3">
                <h3 className="font-medium text-sm text-gray-500">Time Period</h3>
                <div className="flex flex-wrap gap-2">
                  {TIME_PERIODS.map((period) => (
                    <Button
                      key={period}
                      variant={timePeriodFilter === period ? "default" : "outline"}
                      size="sm"
                      className="rounded-full h-8"
                      onClick={() => setTimePeriodFilter(period)}
                    >
                      {period}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Has Recipe Filter */}
              <div className="space-y-3">
                <h3 className="font-medium text-sm text-gray-500">Linked to Recipe</h3>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={hasRecipeFilter === null ? "default" : "outline"}
                    size="sm"
                    className="rounded-full h-8"
                    onClick={() => setHasRecipeFilter(null)}
                  >
                    All
                  </Button>
                  <Button
                    variant={hasRecipeFilter === true ? "default" : "outline"}
                    size="sm"
                    className="rounded-full h-8"
                    onClick={() => setHasRecipeFilter(true)}
                  >
                    With Recipe
                  </Button>
                  <Button
                    variant={hasRecipeFilter === false ? "default" : "outline"}
                    size="sm"
                    className="rounded-full h-8"
                    onClick={() => setHasRecipeFilter(false)}
                  >
                    Without Recipe
                  </Button>
                </div>
              </div>

              {/* Item Count Range Slider */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-base text-gray-900">Number of Items</h3>
                  <span className="text-base text-gray-500">
                    {itemCountRange[0]} - {itemCountRange[1]} items
                  </span>
                </div>
                <div className="pt-2 px-3">
                  <div className="relative">
                    <div className="absolute inset-x-0 h-2 bg-gray-100 rounded-full" />
                    <div
                      className="absolute h-2 bg-gray-900 rounded-full"
                      style={{
                        left: `${(itemCountRange[0] / 100) * 100}%`,
                        right: `${100 - (itemCountRange[1] / 100) * 100}%`
                      }}
                    />
                    <Slider
                      min={0}
                      max={100}
                      step={1}
                      value={itemCountRange}
                      onValueChange={setItemCountRange}
                      className="relative w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredLists?.map((list) => (
            <div key={list.id} className="relative group">
              <Card 
                style={{
                  borderRadius: '24px',
                  overflow: 'hidden',
                  position: 'relative',
                  transition: 'all 2500ms cubic-bezier(0.19, 1, 0.22, 1)',
                  transform: `scale(${selectedLists.includes(list.id) ? '0.98' : '1'})`,
                  transformOrigin: 'center'
                }}
                className={`
                  cursor-pointer 
                  shadow-sm
                  hover:shadow-lg
                  h-[280px] sm:h-[300px] md:h-[320px]
                  rounded-[24px]
                  transform-gpu
                  ${selectedLists.includes(list.id) 
                    ? 'ring-2 ring-primary ring-offset-2 ring-offset-background bg-primary/5' 
                    : 'hover:scale-[1.02] transition-all duration-2500'
                  }
                  group
                `}
                onClick={(e) => handleCardClick(list.id, e)}
              >
                <div className="absolute inset-0 rounded-[24px] overflow-hidden">
                  {(list.image_url || list.recipe?.image_url) ? (
                    <>
                      <img
                        src={list.image_url || list.recipe?.image_url}
                        alt={list.title}
                        className={`
                          absolute inset-0 w-full h-full object-cover
                          transition-all duration-2500
                          group-hover:scale-[1.04]
                          ${selectedLists.includes(list.id) ? 'brightness-95' : ''}
                        `}
                        style={{
                          transitionTimingFunction: 'cubic-bezier(0.19, 1, 0.22, 1)'
                        }}
                      />
                      {isSelectionMode && (
                        <div className="absolute top-3 left-3 bg-white/30 backdrop-blur-md p-1.5 rounded-full flex items-center justify-center shadow-lg border border-white/30 z-10 transition-opacity duration-200">
                          <div className={cn(
                            "h-5 w-5 rounded-full border-2 transition-colors duration-200",
                            selectedLists.includes(list.id)
                              ? "bg-primary border-transparent"
                              : "border-white/80 bg-white/20"
                          )}>
                            {selectedLists.includes(list.id) && (
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="white"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-full w-full p-1"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </div>
                        </div>
                      )}
                      {list.recipe && (
                        <div className="absolute top-3 right-3 bg-white/30 backdrop-blur-md p-1.5 rounded-full flex items-center justify-center shadow-lg border border-white/30 z-10">
                          <LinkIcon className="h-4 w-4 text-white" />
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 h-[50%]">
                        <div 
                          className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
                        />
                        <div 
                          className="absolute inset-0 backdrop-blur-[5px]"
                          style={{ 
                            maskImage: 'linear-gradient(to top, black 60%, transparent)',
                            WebkitMaskImage: 'linear-gradient(to top, black 60%, transparent)'
                          }}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                      <List className="h-16 w-16 text-gray-300" />
                      {isSelectionMode && (
                        <div className="absolute top-3 left-3 bg-gray-200 p-1.5 rounded-full flex items-center justify-center shadow-sm z-10">
                          <div className={cn(
                            "h-5 w-5 rounded-full border-2 transition-colors duration-200",
                            selectedLists.includes(list.id)
                              ? "bg-primary border-transparent"
                              : "border-gray-400 bg-white"
                          )}>
                            {selectedLists.includes(list.id) && (
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="white"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-full w-full p-1"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <h3 className="font-semibold text-lg sm:text-xl line-clamp-2 text-white">
                    {list.title}
                  </h3>
                  {list.recipe && (
                    <p className="mt-2 text-sm line-clamp-2 text-white/80">
                      From recipe: {list.recipe.title}
                    </p>
                  )}
                  <p className="mt-2 text-sm text-white/80">
                    {Array.isArray(list.items) ? list.items.length : 0} items
                  </p>
                </div>
              </Card>
            </div>
          ))}
        </div>

        {filteredLists?.length === 0 && (
          <div className="text-center py-12">
            <List className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No lists found</h3>
            <p className="mt-2 text-gray-600">
              {searchTerm || getActiveFilterCount() > 0 
                ? "Try different search terms or filters" 
                : "Create your first grocery list"
              }
            </p>
            {!searchTerm && getActiveFilterCount() === 0 && (
              <Button 
                onClick={() => navigate("/grocery-lists/new")} 
                variant="secondary"
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create List
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
