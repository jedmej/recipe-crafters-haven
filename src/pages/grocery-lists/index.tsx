
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Loader2 } from "lucide-react";
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
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Grocery Lists</h1>
        <Button onClick={() => navigate("/grocery-lists/new")} className="gap-2">
          <Plus className="h-4 w-4" />
          New List
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lists?.map((list) => (
          <Card 
            key={list.id} 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(`/grocery-lists/${list.id}`)}
          >
            <CardHeader>
              <CardTitle>{list.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {(list.items as string[]).length} items
              </p>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
