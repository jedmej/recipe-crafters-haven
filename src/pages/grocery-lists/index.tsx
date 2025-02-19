import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Plus, Loader2, List, Search, Link as LinkIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Input } from "@/components/ui/input";
import { useState } from "react";

type GroceryList = Database['public']['Tables']['grocery_lists']['Row'] & {
  recipe?: {
    id: string;
    title: string;
    image_url: string;
  } | null;
};

export default function GroceryListsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

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

  const filteredLists = lists?.filter(list => 
    list.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            My Grocery Lists
          </h1>
          <div className="flex gap-2 mb-4">
            <Button 
              onClick={() => navigate("/grocery-lists/new")} 
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              New List
            </Button>
          </div>
        </header>

        <div className="flex items-center gap-2 max-w-md mb-6">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search lists..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLists?.map((list) => (
            <Card 
              key={list.id} 
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
              onClick={() => navigate(`/grocery-lists/${list.id}`)}
            >
              <div className="relative">
                {(list.image_url || list.recipe?.image_url) && (
                  <div className="relative h-48 w-full">
                    <img
                      src={list.image_url || list.recipe?.image_url}
                      alt={list.title}
                      className="absolute inset-0 w-full h-full object-cover rounded-t-lg"
                    />
                    {list.recipe && (
                      <div className="absolute top-2 right-2 bg-black/50 rounded-full p-2">
                        <LinkIcon className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                )}
              </div>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span className="line-clamp-1">{list.title}</span>
                </CardTitle>
                {list.recipe && (
                  <p className="text-sm text-muted-foreground mt-1">
                    From recipe: {list.recipe.title}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {(list.items as any[]).length} items
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredLists?.length === 0 && (
          <div className="text-center py-12">
            <List className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No lists found</h3>
            <p className="mt-2 text-gray-600">
              {searchTerm ? "Try a different search term" : "Create your first grocery list"}
            </p>
            {!searchTerm && (
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
