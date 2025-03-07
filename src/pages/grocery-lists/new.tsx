import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Loader2, ArrowLeft, Trash, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ImageUploadOrGenerate } from "@/components/recipes/ImageUploadOrGenerate";
import { categorizeItem } from "@/features/groceries/utils/categorization";

export default function NewGroceryListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get recipe_id and image_url from location state if coming from a recipe
  const recipeId = location.state?.recipeId;
  const recipeImageUrl = location.state?.recipeImageUrl;

  const [formData, setFormData] = useState({
    title: location.state?.recipeTitle ? `Grocery List for ${location.state.recipeTitle}` : "",
    items: [""],
    image_url: recipeImageUrl || "",
    recipe_id: recipeId || null
  });

  // Fetch recipe details if we have a recipe_id
  const { data: recipe } = useQuery({
    queryKey: ['recipe', recipeId],
    queryFn: async () => {
      if (!recipeId) return null;
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', recipeId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!recipeId
  });

  const createList = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from('grocery_lists')
        .insert([
          {
            ...formData,
            user_id: user.id,
            items: formData.items
              .filter(i => i.trim() !== "")
              .map(item => ({ 
                name: item, 
                checked: false,
                category: categorizeItem(item)
              })),
            recipe_id: formData.recipe_id,
            image_url: formData.image_url || (recipe?.image_url || "")
          }
        ])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groceryLists'] });
      navigate('/grocery-lists');
      toast({
        title: "Success",
        description: "Your grocery list has been created.",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a title for your list.",
      });
      return;
    }
    setIsSubmitting(true);
    await createList.mutateAsync();
    setIsSubmitting(false);
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, ""]
    }));
  };

  const updateItem = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => i === index ? value : item)
    }));
  };

  const removeItem = (index: number) => {
    if (formData.items.length === 1) {
      setFormData(prev => ({
        ...prev,
        items: [""]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

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
          <form onSubmit={handleSubmit}>
            <CardHeader className="border-b bg-gray-50/50">
              <CardTitle>
                {recipeId ? "Create Grocery List from Recipe" : "Create New Grocery List"}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">List Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter list title"
                  className="max-w-md"
                />
              </div>

              {!recipeId && (
                <div className="space-y-2">
                  <Label>List Image</Label>
                  <div className="w-full max-w-2xl mx-auto p-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                    <ImageUploadOrGenerate
                      onImageSelected={(imageUrl) => setFormData(prev => ({ ...prev, image_url: imageUrl }))}
                      title={formData.title}
                      disabled={isSubmitting}
                      toggleMode={false}
                      hasExistingImage={!!formData.image_url}
                    />
                  </div>
                </div>
              )}

              {recipeId && recipe && (
                <div className="space-y-2">
                  <Label>Recipe Image</Label>
                  <div className="relative w-full max-w-2xl mx-auto">
                    <img
                      src={recipe.image_url}
                      alt={recipe.title}
                      className="w-full rounded-lg shadow-md"
                    />
                  </div>
                </div>
              )}

              <Separator />

              <div className="space-y-4">
                <Label>Items</Label>
                <div className="space-y-2">
                  {formData.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={item}
                        onChange={e => updateItem(index, e.target.value)}
                        placeholder={`Item ${index + 1}`}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeItem(index)}
                        className="shrink-0"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addItem}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </CardContent>

            <CardFooter className="flex justify-end space-x-4 pt-6 border-t bg-gray-50/50">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/grocery-lists")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create List"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
