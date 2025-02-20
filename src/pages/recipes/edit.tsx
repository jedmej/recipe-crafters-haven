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
import { ImageUploadOrGenerate } from "@/components/recipes/ImageUploadOrGenerate";

type Recipe = Database['public']['Tables']['recipes']['Row'];

export default function EditRecipePage() {
  const { id } = useParams();
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

  const { data: recipe, isLoading, error } = useQuery({
    queryKey: ['recipes', id],
    queryFn: async () => {
      if (!id) throw new Error("Recipe ID is required");

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Recipe not found');
      
      return data as Recipe;
    },
    enabled: !!id
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
        language: recipe.language || "en",
        image_url: recipe.image_url || ""
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
      const dataToUpdate = {
        ...formData,
        image_url: formData.image_url || recipe?.image_url,
        ingredients: formData.ingredients,
        instructions: formData.instructions,
        title: formData.title,
        description: formData.description,
        prep_time: formData.prep_time,
        cook_time: formData.cook_time,
        estimated_calories: formData.estimated_calories,
        servings: formData.servings,
        source_url: formData.source_url,
        language: formData.language
      };
      
      await updateRecipe.mutateAsync(dataToUpdate);
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

  if (!id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-lg text-red-500">Recipe ID is required</p>
        <Button variant="ghost" onClick={() => navigate('/recipes')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Recipes
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-lg text-red-500">{error instanceof Error ? error.message : 'Error loading recipe'}</p>
        <Button variant="ghost" onClick={() => navigate('/recipes')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Recipes
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-lg text-red-500">Recipe not found</p>
        <Button variant="ghost" onClick={() => navigate('/recipes')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Recipes
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <Button
              variant="ghost"
              onClick={() => navigate(`/recipes/${id}`)}
              className="h-9"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Recipe
            </Button>
          </div>
        </header>

        <Card className="hover:shadow-lg transition-all duration-200">
          <CardHeader>
            <CardTitle>Edit Recipe</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Recipe Image</label>
                <div className="relative">
                  {recipe.image_url && (
                    <img
                      src={recipe.image_url}
                      alt={recipe.title}
                      className="w-full max-w-2xl rounded-lg shadow-md mx-auto mb-4"
                    />
                  )}
                  <ImageUploadOrGenerate
                    onImageSelected={(imageUrl) => {
                      setFormData(prev => ({
                        ...prev,
                        image_url: imageUrl
                      }));
                      if (recipe) {
                        recipe.image_url = imageUrl;
                      }
                    }}
                    title={formData.title}
                    disabled={isSubmitting}
                    toggleMode={false}
                    hasExistingImage={!!recipe?.image_url}
                  />
                </div>
              </div>
              <EditRecipeForm
                formData={formData}
                isSubmitting={isSubmitting}
                onSubmit={handleSubmit}
                onUpdateFormData={(updates) => setFormData(prev => ({ ...prev, ...updates }))}
                onAddListItem={addListItem}
                onUpdateListItem={updateListItem}
                onRemoveListItem={removeListItem}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
