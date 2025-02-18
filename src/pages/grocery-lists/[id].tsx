
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, ArrowLeft, Trash, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

type GroceryList = Database['public']['Tables']['grocery_lists']['Row'];

export default function GroceryListDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: list, isLoading } = useQuery({
    queryKey: ['groceryLists', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('grocery_lists')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as GroceryList;
    }
  });

  const deleteList = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('grocery_lists')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groceryLists'] });
      navigate('/grocery-lists');
      toast({
        title: "List deleted",
        description: "Your grocery list has been successfully deleted.",
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

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this list?')) {
      setIsDeleting(true);
      await deleteList.mutateAsync();
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!list) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold">List not found</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => navigate("/grocery-lists")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Lists
      </Button>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-3xl">{list.title}</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(`/grocery-lists/${id}/edit`)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              size="icon"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <ul className="space-y-2">
            {(list.items as string[]).map((item, index) => (
              <li key={index} className="flex items-center gap-2">
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
