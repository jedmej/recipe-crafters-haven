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

// Custom hook to manage recipe form state
function useRecipeForm(initialRecipe?: Recipe) {
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
  
  // Update form data when initial recipe changes
  useEffect(() => {
    if (initialRecipe) {
      setFormData({
        title: initialRecipe.title,
        description: initialRecipe.description || "",
        ingredients: initialRecipe.ingredients as string[],
        instructions: initialRecipe.instructions as string[],
        prep_time: initialRecipe.prep_time || 0,
        cook_time: initialRecipe.cook_time || 0,
        estimated_calories: initialRecipe.estimated_calories || 0,
        servings: initialRecipe.servings || 1,
        source_url: initialRecipe.source_url || "",
        language: initialRecipe.language || "en",
        image_url: initialRecipe.image_url || "",
        categories: {
          meal_type: initialRecipe.categories?.meal_type || "",
          dietary_restrictions: initialRecipe.categories?.dietary_restrictions || "",
          difficulty_level: initialRecipe.categories?.difficulty_level || "",
          cuisine_type: initialRecipe.categories?.cuisine_type || "",
          cooking_method: initialRecipe.categories?.cooking_method || ""
        }
      });
    }
  }, [initialRecipe]);

  // Form update handlers
  const updateFormData = (updates: Partial<Recipe>) => 
    setFormData(prev => ({ ...prev, ...updates }));
  
  const addListItem = (key: "ingredients" | "instructions") => 
    setFormData(prev => ({
      ...prev,
      [key]: [...((prev[key] as string[]) || []), ""]
    }));
  
  const updateListItem = (key: "ingredients" | "instructions", index: number, value: string) => 
    setFormData(prev => ({
      ...prev,
      [key]: ((prev[key] as string[]) || []).map((item, i) => i === index ? value : item)
    }));
  
  const removeListItem = (key: "ingredients" | "instructions", index: number) => 
    setFormData(prev => ({
      ...prev,
      [key]: ((prev[key] as string[]) || []).filter((_, i) => i !== index)
    }));

  // Validation
  const validateForm = () => {
    if (!formData.title?.trim()) return "Please provide a recipe title.";
    if (!(formData.ingredients as string[])?.some(i => i.trim() !== "")) 
      return "Please add at least one ingredient.";
    if (!(formData.instructions as string[])?.some(i => i.trim() !== "")) 
      return "Please add at least one instruction step.";
    return null;
  };

  return {
    formData,
    updateFormData,
    addListItem,
    updateListItem,
    removeListItem,
    validateForm
  };
}

// Component for recipe metadata fields
const RecipeMetadata = ({ formData, updateFormData }) => (
  <Card>
    <CardContent className="p-6">
      <div className="grid grid-cols-3 lg:grid-cols-1 gap-4">
        <MetadataField 
          icon={<Clock className="h-6 w-6 text-gray-500 mb-2" />}
          label="Prep Time"
          value={formData.prep_time}
          onChange={val => updateFormData({ prep_time: parseInt(val) || 0 })}
        />
        <MetadataField 
          icon={<Timer className="h-6 w-6 text-gray-500 mb-2" />}
          label="Cook Time"
          value={formData.cook_time}
          onChange={val => updateFormData({ cook_time: parseInt(val) || 0 })}
        />
        <MetadataField 
          icon={<Flame className="h-6 w-6 text-gray-500 mb-2" />}
          label="Calories"
          value={formData.estimated_calories}
          onChange={val => updateFormData({ estimated_calories: parseInt(val) || 0 })}
        />
        <MetadataField 
          label="Servings"
          value={formData.servings}
          onChange={val => updateFormData({ servings: parseInt(val) || 1 })}
        />
      </div>
    </CardContent>
  </Card>
);

// Reusable metadata field component
const MetadataField = ({ icon, label, value, onChange }) => (
  <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
    {icon}
    <p className="text-sm text-gray-500">{label}</p>
    <Input
      type="number"
      min="0"
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-24 mt-1"
    />
  </div>
);

export default function EditRecipePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch recipe data
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

  // Use custom hooks
  const { formData, updateFormData, addListItem, updateListItem, removeListItem, validateForm } = useRecipeForm(recipe);
  const updateRecipe = useRecipeUpdate(id as string);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      toast({ variant: "destructive", title: "Invalid form", description: validationError });
      return;
    }

    setIsSubmitting(true);
    try {
      const dataToUpdate = {
        ...formData,
        image_url: formData.image_url || recipe?.image_url,
      };
      
      await updateRecipe.mutateAsync(dataToUpdate);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle error states
  if (!id) {
    return <ErrorState message="Recipe ID is required" onBack={() => navigate('/recipes')} />;
  }

  if (error) {
    return <ErrorState 
      message={error instanceof Error ? error.message : 'Error loading recipe'}
      onBack={() => navigate('/recipes')} 
    />;
  }

  if (isLoading) {
    return <LoadingState />;
  }

  if (!recipe) {
    return <ErrorState message="Recipe not found" onBack={() => navigate('/recipes')} />;
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
                <div className="space-y-2">
                  <label className="text-sm font-medium">Recipe Image</label>
                  <ImageUploadOrGenerate
                    onImageSelected={(imageUrl) => updateFormData({ image_url: imageUrl })}
                    title={formData.title}
                    disabled={isSubmitting}
                    initialImage={formData.image_url}
                    hasExistingImage={!!formData.image_url}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-4">
            <RecipeMetadata formData={formData} updateFormData={updateFormData} />
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
                  onUpdateFormData={updateFormData}
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

// Loading state component
const LoadingState = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="h-8 w-8 animate-spin" />
  </div>
);

// Error state component
const ErrorState = ({ message, onBack }) => (
  <div className="flex flex-col items-center justify-center min-h-screen gap-4">
    <p className="text-lg text-red-500">{message}</p>
    <Button variant="ghost" onClick={onBack}>
      <ArrowLeft className="mr-2 h-4 w-4" />
      Back to Recipes
    </Button>
  </div>
);
