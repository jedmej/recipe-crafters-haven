import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

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

export function useGroceryList(id: string | undefined) {
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

      const items = Array.isArray(data.items) 
        ? (data.items as (string | GroceryItem)[]).map(item => {
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

    queryClient.setQueryData(['groceryLists', id], {
      ...list,
      items: newItems
    });

    await updateItems.mutateAsync(newItems);

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

  return {
    list,
    isLoading,
    deleteList,
    updateImage,
    toggleItem
  };
} 