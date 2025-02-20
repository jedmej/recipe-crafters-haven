import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Plus, Loader2, Search, Bot, Trash, FileText, FileImage } from "lucide-react";
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
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            My Recipes
          </h1>
          
          {/* Main action buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Button onClick={() => navigate("/recipes/ai-search")} variant="outline" className="flex-1 sm:flex-none gap-2 min-w-[120px]">
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">AI Search</span>
              <span className="sm:hidden">Search</span>
            </Button>
            <Button onClick={() => navigate("/recipes/import-ai")} variant="outline" className="flex-1 sm:flex-none gap-2 min-w-[120px]">
              <Bot className="h-4 w-4" />
              <span className="hidden sm:inline">Import from URL</span>
              <span className="sm:hidden">Import</span>
            </Button>
            <Button onClick={() => navigate("/recipes/new")} className="flex-1 sm:flex-none gap-2 min-w-[120px]">
              <Plus className="h-4 w-4" />
              <span>Add Recipe</span>
            </Button>
            <Button onClick={() => navigate("/generate-image")} variant="outline" className="flex-1 sm:flex-none gap-2 min-w-[120px]">
              <FileImage className="h-4 w-4" />
              <span className="hidden sm:inline">Generate Image</span>
              <span className="sm:hidden">Image</span>
            </Button>
          </div>

          {/* Search and selection controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            <div className="relative flex-1">
              <Input
                type="search"
                placeholder="Search recipes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
            
            <div className="flex gap-2">
              <div 
                onClick={toggleSelectionMode} 
                className={cn(
                  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer",
                  "h-10 px-4 py-2 transition-colors",
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
                    <Button variant="destructive" className="gap-2 whitespace-nowrap">
                      <Trash className="h-4 w-4" />
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
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredRecipes?.map((recipe, index) => (
            <div key={recipe.id} className="relative group">
              <Card 
                style={{
                  transform: selectedRecipes.includes(recipe.id) 
                    ? 'scale(0.98)' 
                    : 'scale(1)',
                  transformOrigin: 'center',
                  borderRadius: '16px',
                  transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                  animation: isSelectionMode ? `gentleShake 600ms ${index * 30}ms cubic-bezier(0.4, 0, 0.2, 1) forwards` : 'none'
                }}
                className={`
                  cursor-pointer 
                  hover:shadow-lg 
                  ${selectedRecipes.includes(recipe.id) ? 
                    'ring-2 ring-primary ring-offset-2 bg-primary/5' : 
                    'hover:scale-[1.02]'
                  }
                `}
                onClick={(e) => handleCardClick(recipe.id, e)}
              >
                {recipe.image_url && (
                  <div className="relative h-40 sm:h-48 w-full">
                    <img
                      src={recipe.image_url}
                      alt={recipe.title}
                      className={`
                        absolute inset-0 w-full h-full object-cover rounded-t-lg
                        transition-all duration-200
                        ${selectedRecipes.includes(recipe.id) ? 'brightness-95' : ''}
                      `}
                    />
                  </div>
                )}
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-lg sm:text-xl line-clamp-2">{recipe.title}</CardTitle>
                </CardHeader>
                {recipe.description && (
                  <CardContent className="p-4 sm:p-6 pt-0">
                    <p className="text-muted-foreground line-clamp-2 text-sm">
                      {recipe.description}
                    </p>
                  </CardContent>
                )}
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
