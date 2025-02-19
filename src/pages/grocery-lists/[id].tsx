import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, ArrowLeft, Trash, Edit, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ImageUploadOrGenerate } from "@/components/recipes/ImageUploadOrGenerate";

interface GroceryItem {
  name: string;
  checked: boolean;
}

type GroceryList = Omit<Database['public']['Tables']['grocery_lists']['Row'], 'items'> & {
  items: GroceryItem[];
  recipe?: {
    id: string;
    title: string;
    image_url: string;
  } | null;
};

export default function GroceryListDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: list, isLoading } = useQuery({
    queryKey: ['groceryLists', id],
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
        .eq('id', id)
        .single();
      
      if (error) throw error;

      // Convert items array to GroceryItem[] or initialize if it's just strings
      const items = Array.isArray(data.items) 
        ? (data.items as any[]).map(item => {
            if (typeof item === 'string') {
              return { name: item, checked: false };
            }
            return item as GroceryItem;
          })
        : [];

      return { ...data, items } as GroceryList;
    }
  });

  const updateItems = useMutation({
    mutationFn: async (items: GroceryItem[]) => {
      // Convert items to a format that matches the Json type
      const itemsForStorage = items.map(item => ({
        name: item.name,
        checked: item.checked
      }));

      const { error } = await supabase
        .from('grocery_lists')
        .update({ items: itemsForStorage })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groceryLists', id] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update items: " + error.message,
      });
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
        title: "Success",
        description: "Your grocery list has been deleted.",
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

  const updateImage = useMutation({
    mutationFn: async (imageUrl: string) => {
      const { error } = await supabase
        .from('grocery_lists')
        .update({ image_url: imageUrl })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groceryLists', id] });
      toast({
        title: "Success",
        description: "List image has been updated.",
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

  const toggleItem = async (itemToToggle: GroceryItem) => {
    if (!list) return;

    const newItems = list.items.map(item => 
      item.name === itemToToggle.name 
        ? { ...item, checked: !item.checked }
        : item
    );

    // Update the items in the UI immediately
    queryClient.setQueryData(['groceryLists', id], {
      ...list,
      items: newItems
    });

    // Then update in the database
    await updateItems.mutateAsync(newItems);

    // Check if all items are checked
    const allChecked = newItems.every(item => item.checked);
    if (allChecked) {
      setTimeout(() => {
        toast({
          title: "List Completed",
          description: "All items have been checked off. The list will be deleted.",
        });
        deleteList.mutate();
      }, 1500);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!list) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6">
        <div className="text-center py-12 border rounded-lg bg-background">
          <h1 className="text-2xl font-bold mb-2">List not found</h1>
          <p className="text-muted-foreground mb-4">This grocery list may have been deleted or doesn't exist.</p>
          <Button onClick={() => navigate("/grocery-lists")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Lists
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate("/grocery-lists")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Lists
        </Button>

        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-gray-50/50">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl font-bold">{list.title}</CardTitle>
                {list.recipe && (
                  <p className="text-sm text-muted-foreground mt-1">
                    From recipe: {list.recipe.title}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigate(`/grocery-lists/${id}/edit`)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="icon">
                      <Trash className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete List</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this grocery list? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteList.mutate()}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="relative mb-6">
              {(list.recipe?.image_url) ? (
                <div className="relative w-full max-w-2xl mx-auto">
                  <img
                    src={list.recipe.image_url}
                    alt={list.recipe.title}
                    className="w-full rounded-lg shadow-md"
                  />
                  {list.recipe && (
                    <Button
                      variant="outline"
                      className="absolute top-2 right-2 bg-white/90 hover:bg-white"
                      onClick={() => navigate(`/recipes/${list.recipe.id}`)}
                    >
                      View Recipe
                    </Button>
                  )}
                </div>
              ) : (
                <div className="w-full max-w-2xl mx-auto p-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                  <p className="text-center text-muted-foreground">No recipe image available</p>
                </div>
              )}
            </div>

            <div className="space-y-1">
              {list.items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent group"
                >
                  <Checkbox
                    checked={item.checked}
                    onCheckedChange={() => toggleItem(item)}
                    className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                  />
                  <span className={`flex-1 ${item.checked ? 'line-through text-muted-foreground' : ''}`}>
                    {item.name}
                  </span>
                  {item.checked ? (
                    <Check className="h-4 w-4 text-green-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  ) : (
                    <X className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
              ))}
            </div>

            {list.items.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No items in this list</p>
                <Button
                  variant="outline"
                  onClick={() => navigate(`/grocery-lists/${id}/edit`)}
                  className="mt-4"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Add Items
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
