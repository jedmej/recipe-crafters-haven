
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SUPPORTED_LANGUAGES } from "@/types/recipe";
import type { RecipeData } from "@/types/recipe";

export default function EditRecipePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<Partial<RecipeData>>({
    title: "",
    description: "",
    ingredients: [""],
    instructions: [""],
    prep_time: 0,
    cook_time: 0,
    estimated_calories: 0,
    suggested_portions: 1,
    portion_description: "serving",
    language: "en"
  });

  // Fetch recipe data
  const { data: recipe, isLoading } = useQuery({
    queryKey: ['recipes', id],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', id)
        .eq('user_id', session.user.id)
        .single();

      if (error) throw error;
      return data;
    }
  });

  // Update form data when recipe is loaded
  useEffect(() => {
    if (recipe) {
      setFormData({
        title: recipe.title,
        description: recipe.description || "",
        ingredients: recipe.ingredients as string[],
        instructions: recipe.instructions as string[],
        prep_time: recipe.prep_time || 0,
        cook_time: recipe.cook_time || 0,
        estimated_calories: recipe.estimated_calories || 0,
        suggested_portions: recipe.suggested_portions || 1,
        portion_description: recipe.portion_description || "serving",
        language: recipe.language || "en"
      });
    }
  }, [recipe]);

  const updateRecipe = useMutation({
    mutationFn: async (data: Partial<RecipeData>) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data: updatedRecipe, error } = await supabase
        .from('recipes')
        .update({
          ...data,
          ingredients: data.ingredients?.filter(i => i.trim() !== ""),
          instructions: data.instructions?.filter(i => i.trim() !== ""),
        })
        .eq('id', id)
        .eq('user_id', session.user.id)
        .select()
        .single();

      if (error) throw error;
      return updatedRecipe;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      navigate(`/recipes/${data.id}`);
      toast({
        title: "Recipe updated successfully!",
        description: "Your changes have been saved.",
      });
    },
    onError: (error: Error) => {
      console.error('Update error:', error);
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "We couldn't save your changes. Please try again.",
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title?.trim()) {
      toast({
        variant: "destructive",
        title: "Invalid form",
        description: "Please provide a recipe title.",
      });
      return;
    }

    if (!formData.ingredients?.some(i => i.trim() !== "")) {
      toast({
        variant: "destructive",
        title: "Invalid form",
        description: "Please add at least one ingredient.",
      });
      return;
    }

    if (!formData.instructions?.some(i => i.trim() !== "")) {
      toast({
        variant: "destructive",
        title: "Invalid form",
        description: "Please add at least one instruction step.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await updateRecipe.mutateAsync(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addListItem = (key: "ingredients" | "instructions") => {
    setFormData(prev => ({
      ...prev,
      [key]: [...(prev[key] || []), ""]
    }));
  };

  const updateListItem = (key: "ingredients" | "instructions", index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [key]: (prev[key] || []).map((item, i) => i === index ? value : item)
    }));
  };

  const removeListItem = (key: "ingredients" | "instructions", index: number) => {
    setFormData(prev => ({
      ...prev,
      [key]: (prev[key] || []).filter((_, i) => i !== index)
    }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => navigate(`/recipes/${id}`)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Recipe
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Edit Recipe</CardTitle>
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
              <label className="text-sm font-medium">Language</label>
              <Select 
                value={formData.language} 
                onValueChange={value => setFormData(prev => ({ ...prev, language: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Ingredients</label>
              {formData.ingredients?.map((ingredient, index) => (
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
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => addListItem("ingredients")}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Ingredient
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Instructions</label>
              {formData.instructions?.map((instruction, index) => (
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
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => addListItem("instructions")}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Step
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Prep Time (minutes)</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.prep_time}
                  onChange={e => setFormData(prev => ({ ...prev, prep_time: parseInt(e.target.value) || 0 }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Cook Time (minutes)</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.cook_time}
                  onChange={e => setFormData(prev => ({ ...prev, cook_time: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Estimated Calories</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.estimated_calories}
                  onChange={e => setFormData(prev => ({ ...prev, estimated_calories: parseInt(e.target.value) || 0 }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Suggested Portions</label>
                <Input
                  type="number"
                  min="1"
                  value={formData.suggested_portions}
                  onChange={e => setFormData(prev => ({ ...prev, suggested_portions: parseInt(e.target.value) || 1 }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Portion Description</label>
              <Input
                value={formData.portion_description}
                onChange={e => setFormData(prev => ({ ...prev, portion_description: e.target.value }))}
                placeholder="e.g., serving, slice, piece"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
