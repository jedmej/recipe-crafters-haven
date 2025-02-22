import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, ArrowLeft, Clock, Timer, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EditRecipeForm } from "@/components/recipes/EditRecipeForm";
import { useRecipeUpdate } from "@/hooks/use-recipe-update";
import type { Database } from "@/integrations/supabase/types";
import { ImageUploadOrGenerate } from "@/components/recipes/ImageUploadOrGenerate";
import { Input } from "@/components/ui/input";

type Recipe = Database['public']['Tables']['recipes']['Row'];

export default function EditRecipePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<Partial<Recipe>>({
    title: "",
    description: "",
    ingredients: [""],
    instructions: [""],
    prep_time: 0,
    cook_time: 0,
    estimated_calories: 0,
    servings: 1,
    source_url: "",
    language: "en",
    categories: {
      meal_type: "",
      dietary_restrictions: "",
      difficulty_level: "",
      cuisine_type: "",
      cooking_method: ""
    }
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
        image_url: recipe.image_url || "",
        categories: {
          meal_type: recipe.categories?.meal_type || "",
          dietary_restrictions: recipe.categories?.dietary_restrictions || "",
          difficulty_level: recipe.categories?.difficulty_level || "",
          cuisine_type: recipe.categories?.cuisine_type || "",
          cooking_method: recipe.categories?.cooking_method || ""
        }
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
      <div className="max-w-7xl mx-auto">
        <Button
          variant="ghost"
          className="mb-8"
          onClick={() => navigate(`/recipes/${id}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Recipe
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          <div className="lg:col-span-8">
            <Card className="overflow-hidden">
              <CardContent className="p-6 lg:p-8">
                <div className="space-y-6">                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Recipe Image</label>
                    <div className="relative">
                      <ImageUploadOrGenerate
                        onImageSelected={(imageUrl) => {
                          setFormData(prev => ({
                            ...prev,
                            image_url: imageUrl
                          }));
                        }}
                        title={formData.title}
                        disabled={isSubmitting}
                        initialImage={formData.image_url}
                        hasExistingImage={!!formData.image_url}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-4">
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-3 lg:grid-cols-1 gap-4">
                  <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
                    <Clock className="h-6 w-6 text-gray-500 mb-2" />
                    <p className="text-sm text-gray-500">Prep Time</p>
                    <Input
                      type="number"
                      min="0"
                      value={formData.prep_time}
                      onChange={e => setFormData(prev => ({ ...prev, prep_time: parseInt(e.target.value) || 0 }))}
                      className="w-24 mt-1"
                    />
                  </div>
                  <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
                    <Timer className="h-6 w-6 text-gray-500 mb-2" />
                    <p className="text-sm text-gray-500">Cook Time</p>
                    <Input
                      type="number"
                      min="0"
                      value={formData.cook_time}
                      onChange={e => setFormData(prev => ({ ...prev, cook_time: parseInt(e.target.value) || 0 }))}
                      className="w-24 mt-1"
                    />
                  </div>
                  <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
                    <Flame className="h-6 w-6 text-gray-500 mb-2" />
                    <p className="text-sm text-gray-500">Calories</p>
                    <Input
                      type="number"
                      min="0"
                      value={formData.estimated_calories}
                      onChange={e => setFormData(prev => ({ ...prev, estimated_calories: parseInt(e.target.value) || 0 }))}
                      className="w-24 mt-1"
                    />
                  </div>
                  <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Servings</p>
                    <Input
                      type="number"
                      min="1"
                      value={formData.servings}
                      onChange={e => setFormData(prev => ({ ...prev, servings: parseInt(e.target.value) || 1 }))}
                      className="w-24 mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-12">
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Edit Recipe</CardTitle>
              </CardHeader>
              <CardContent className="p-6 lg:p-8">
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
        </div>
      </div>
    </div>
  );
}
