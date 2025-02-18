
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EditRecipeForm } from "@/components/recipes/EditRecipeForm";
import { useRecipeUpdate } from "@/hooks/use-recipe-update";
import type { Database } from "@/integrations/supabase/types";

type Recipe = Database['public']['Tables']['recipes']['Row'];

export default function EditRecipePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<Partial<Recipe>>({
    title: "",
    description: "",
    ingredients: [],
    instructions: [],
    prep_time: 0,
    cook_time: 0,
    estimated_calories: 0,
    servings: 1,
    source_url: "",
    language: "en"
  });

  const { data: recipe, isLoading } = useQuery({
    queryKey: ['recipes', id],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Recipe;
    }
  });

  const updateRecipe = useRecipeUpdate(id as string);

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
        servings: recipe.servings || 1,
        source_url: recipe.source_url || "",
        language: recipe.language || "en"
      });
    }
  }, [recipe]);

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

    if (!(formData.ingredients as string[])?.some(i => i.trim() !== "")) {
      toast({
        variant: "destructive",
        title: "Invalid form",
        description: "Please add at least one ingredient.",
      });
      return;
    }

    if (!(formData.instructions as string[])?.some(i => i.trim() !== "")) {
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
      [key]: [...((prev[key] as string[]) || []), ""]
    }));
  };

  const updateListItem = (key: "ingredients" | "instructions", index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [key]: ((prev[key] as string[]) || []).map((item, i) => i === index ? value : item)
    }));
  };

  const removeListItem = (key: "ingredients" | "instructions", index: number) => {
    setFormData(prev => ({
      ...prev,
      [key]: ((prev[key] as string[]) || []).filter((_, i) => i !== index)
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
          <EditRecipeForm
            formData={formData}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onUpdateFormData={(updates) => setFormData(prev => ({ ...prev, ...updates }))}
            onAddListItem={addListItem}
            onUpdateListItem={updateListItem}
            onRemoveListItem={removeListItem}
          />
        </CardContent>
      </Card>
    </div>
  );
}
