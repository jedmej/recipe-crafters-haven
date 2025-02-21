import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Plus, Loader2, Search, Bot, Trash, FileText, FileImage, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Recipe = Database['public']['Tables']['recipes']['Row'];

export default function RecipesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecipes, setSelectedRecipes] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const { data: recipes, isLoading } = useQuery({
    queryKey: ['recipes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Recipe[];
    }
  });

  const filteredRecipes = recipes?.filter(recipe => 
    recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipe.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const deleteRecipes = useMutation({
    mutationFn: async (recipeIds: string[]) => {
      const { error } = await supabase
        .from('recipes')
        .delete()
        .in('id', recipeIds);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      setSelectedRecipes([]);
      setIsSelectionMode(false);
      toast({
        title: "Recipes deleted",
        description: "Selected recipes have been deleted successfully.",
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

  const handleCardClick = (recipeId: string, event: React.MouseEvent) => {
    if (isSelectionMode) {
      toggleRecipeSelection(recipeId);
    } else {
      navigate(`/recipes/${recipeId}`);
    }
  };

  const toggleRecipeSelection = (recipeId: string) => {
    setSelectedRecipes(prev => {
      const newSelection = prev.includes(recipeId)
        ? prev.filter(id => id !== recipeId)
        : [...prev, recipeId];
      
      if (newSelection.length === 0) {
        setIsSelectionMode(false);
      }
      
      return newSelection;
    });
  };

  const handleDeleteSelected = () => {
    deleteRecipes.mutate(selectedRecipes);
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      setSelectedRecipes([]);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <style>
        {`
          @keyframes gentleShake {
            0% { transform: rotate(0deg) scale(1); }
            25% { transform: rotate(-0.5deg) scale(1.005); }
            75% { transform: rotate(0.5deg) scale(1.005); }
            85% { transform: rotate(0.2deg) scale(1.002); }
            95% { transform: rotate(-0.1deg) scale(1.001); }
            100% { transform: rotate(0deg) scale(1); }
          }
        `}
      </style>
      <div className="max-w-7xl mx-auto">
        {/* New Recipe Section */}
        <div className="mb-16 p-8 bg-gray-50 rounded-3xl shadow-sm">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">New Recipe</h2>
          <div className="flex flex-wrap gap-4 max-w-3xl">
            <Button 
              onClick={() => navigate("/recipes/ai-search")} 
              variant="outline" 
              className="flex-1 sm:flex-none gap-2 h-14 px-6 text-base rounded-xl"
            >
              <Search className="h-5 w-5" />
              <span className="hidden sm:inline">AI Search</span>
              <span className="sm:hidden">Search</span>
            </Button>
            <Button 
              onClick={() => navigate("/recipes/import-ai")} 
              variant="outline" 
              className="flex-1 sm:flex-none gap-2 h-14 px-6 text-base rounded-xl"
            >
              <Bot className="h-5 w-5" />
              <span className="hidden sm:inline">Import from URL</span>
              <span className="sm:hidden">Import</span>
            </Button>
            <Button 
              onClick={() => navigate("/recipes/new")} 
              className="flex-1 sm:flex-none gap-2 h-14 px-6 text-base rounded-xl bg-gray-900 hover:bg-gray-800"
            >
              <Plus className="h-5 w-5" />
              <span>Add Recipe</span>
            </Button>
          </div>
        </div>

        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">
            My Recipes
          </h1>

          {/* Search and selection controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center max-w-5xl">
            <div className="relative flex-1">
              <Input
                type="search"
                placeholder="Search recipes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 h-12 text-base rounded-xl"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
            
            <div className="flex gap-2">
              <div 
                onClick={toggleSelectionMode} 
                className={cn(
                  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-base font-medium cursor-pointer",
                  "h-12 px-6 py-2 transition-colors",
                  isSelectionMode 
                    ? "bg-secondary text-secondary-foreground hover:bg-secondary/80" 
                    : "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {isSelectionMode ? "Cancel Selection" : "Select Multiple"}
              </div>
              {isSelectionMode && selectedRecipes.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="gap-2 whitespace-nowrap h-12 px-6 rounded-xl">
                      <Trash className="h-5 w-5" />
                      Delete Selected ({selectedRecipes.length})
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
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
          {filteredRecipes?.map((recipe, index) => (
            <div key={recipe.id} className="relative group">
              <Card 
                style={{
                  borderRadius: '24px',
                  overflow: 'hidden',
                  position: 'relative',
                  transition: 'all 2500ms cubic-bezier(0.19, 1, 0.22, 1)',
                  transform: `scale(${selectedRecipes.includes(recipe.id) ? '0.98' : '1'})`,
                  transformOrigin: 'center'
                }}
                className={`
                  cursor-pointer 
                  shadow-sm
                  hover:shadow-lg
                  h-[300px] md:h-[320px]
                  rounded-[24px]
                  transform-gpu
                  ${selectedRecipes.includes(recipe.id) 
                    ? 'ring-2 ring-primary ring-offset-2 ring-offset-background bg-primary/5' 
                    : 'hover:scale-[1.02] transition-all duration-2500'
                  }
                  group
                `}
                onClick={(e) => handleCardClick(recipe.id, e)}
              >
                <div className="absolute inset-0 rounded-[24px] overflow-hidden">
                  {recipe.image_url ? (
                    <>
                      <img
                        src={recipe.image_url}
                        alt={recipe.title}
                        className={`
                          absolute inset-0 w-full h-full object-cover
                          transition-all duration-2500
                          group-hover:scale-[1.04]
                          ${selectedRecipes.includes(recipe.id) ? 'brightness-95' : ''}
                        `}
                        style={{
                          transitionTimingFunction: 'cubic-bezier(0.19, 1, 0.22, 1)'
                        }}
                      />
                      {isSelectionMode && (
                        <div className="absolute top-3 left-3 bg-white/30 backdrop-blur-md p-1.5 rounded-full flex items-center justify-center shadow-lg border border-white/30 z-10 transition-opacity duration-200">
                          <div className={cn(
                            "h-5 w-5 rounded-full border-2 transition-colors duration-200",
                            selectedRecipes.includes(recipe.id)
                              ? "bg-primary border-transparent"
                              : "border-white/80 bg-white/20"
                          )}>
                            {selectedRecipes.includes(recipe.id) && (
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
                      {recipe.cook_time && (
                        <div className="absolute top-3 right-3 bg-white/30 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg border border-white/30 z-10">
                          <Clock className="w-4 h-4 text-white" />
                          <span className="text-sm font-medium text-white drop-shadow-sm">{recipe.cook_time} min</span>
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
                    <div className="absolute inset-0 bg-gray-100" />
                  )}
                </div>
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <h3 className="font-semibold text-lg sm:text-xl line-clamp-2 text-white">
                    {recipe.title}
                  </h3>
                  {recipe.description && (
                    <p className="mt-2 text-sm line-clamp-2 text-white/80">
                      {recipe.description}
                    </p>
                  )}
                </div>
              </Card>
            </div>
          ))}
        </div>

        {filteredRecipes?.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No recipes found</h3>
            <p className="mt-2 text-gray-600">
              Get started by creating a new recipe
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
