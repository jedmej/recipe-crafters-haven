
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function NewRecipePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    ingredients: [""],
    instructions: [""],
    image_url: "",
    source_url: "",
  });

  const createRecipe = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from('recipes')
        .insert([
          {
            ...formData,
            user_id: user.id,
            ingredients: formData.ingredients.filter(i => i.trim() !== ""),
            instructions: formData.instructions.filter(i => i.trim() !== ""),
          }
        ])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      navigate('/recipes');
      toast({
        title: "Recipe created",
        description: "Your recipe has been successfully created.",
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
    setIsSubmitting(true);
    await createRecipe.mutateAsync();
    setIsSubmitting(false);
  };

  const addListItem = (key: "ingredients" | "instructions") => {
    setFormData(prev => ({
      ...prev,
      [key]: [...prev[key], ""]
    }));
  };

  const updateListItem = (key: "ingredients" | "instructions", index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [key]: prev[key].map((item, i) => i === index ? value : item)
    }));
  };

  const removeListItem = (key: "ingredients" | "instructions", index: number) => {
    setFormData(prev => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="container mx-auto py-8">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => navigate("/recipes")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Recipes
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Create New Recipe</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Image URL</label>
              <Input
                type="url"
                value={formData.image_url}
                onChange={e => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Source URL</label>
              <Input
                type="url"
                value={formData.source_url}
                onChange={e => setFormData(prev => ({ ...prev, source_url: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Ingredients</label>
              {formData.ingredients.map((ingredient, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={ingredient}
                    onChange={e => updateListItem("ingredients", index, e.target.value)}
                    placeholder={`Ingredient ${index + 1}`}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeListItem("ingredients", index)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => addListItem("ingredients")}
              >
                Add Ingredient
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Instructions</label>
              {formData.instructions.map((instruction, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={instruction}
                    onChange={e => updateListItem("instructions", index, e.target.value)}
                    placeholder={`Step ${index + 1}`}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeListItem("instructions", index)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => addListItem("instructions")}
              >
                Add Step
              </Button>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Recipe...
                </>
              ) : (
                "Create Recipe"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
