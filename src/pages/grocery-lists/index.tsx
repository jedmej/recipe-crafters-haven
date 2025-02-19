import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Loader2, List } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type GroceryList = Database['public']['Tables']['grocery_lists']['Row'];

export default function GroceryListsPage() {
  const navigate = useNavigate();

  const { data: lists, isLoading } = useQuery({
    queryKey: ['groceryLists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('grocery_lists')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as GroceryList[];
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            My Grocery Lists
          </h1>
          <Button 
            onClick={() => navigate("/grocery-lists/new")} 
            className="gap-2 hover:shadow-md transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            New List
          </Button>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lists?.map((list) => (
            <Card 
              key={list.id} 
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
              onClick={() => navigate(`/grocery-lists/${list.id}`)}
            >
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{list.title}</span>
                  <span className="text-sm text-muted-foreground">
                    {(list.items as string[]).length} items
                  </span>
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>

        {lists?.length === 0 && (
          <div className="text-center py-12">
            <div className="space-y-4">
              <List className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900">No lists yet</h3>
              <p className="text-gray-600">Create your first grocery list</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
