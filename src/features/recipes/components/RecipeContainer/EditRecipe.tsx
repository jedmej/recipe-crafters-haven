
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRecipeForm } from "../../hooks/useRecipeForm";
import RecipeForm from "../RecipeForm";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LoadingState } from "../UI/LoadingState";
import { ErrorState } from "../UI/ErrorState";
import { PageLayout } from "./PageLayout";
import { RecipeFormData } from "../../types";

export function EditRecipeContainer() {
  const { id } = useParams();
  const navigate = useNavigate();
  
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
      
      // Transform the database data to RecipeFormData
      const recipeData: RecipeFormData = {
        id: data.id,
        title: data.title,
        description: data.description || '',
        ingredients: Array.isArray(data.ingredients) 
          ? data.ingredients.map(item => typeof item === 'string' ? item : String(item))
          : [],
        instructions: Array.isArray(data.instructions)
          ? data.instructions.map(item => typeof item === 'string' ? item : String(item))
          : [],
        prep_time: data.prep_time || 0,
        cook_time: data.cook_time || 0,
        estimated_calories: data.estimated_calories || 0,
        servings: data.servings || 1,
        image_url: data.image_url,
        source_url: data.source_url,
        language: data.language,
        categories: data.categories ? {
          meal_type: data.categories.meal_type as string,
          dietary_restrictions: data.categories.dietary_restrictions as string | string[],
          difficulty_level: data.categories.difficulty_level as string,
          cuisine_type: data.categories.cuisine_type as string,
          cooking_method: data.categories.cooking_method as string | string[],
          occasion: data.categories.occasion as string | undefined,
          course_category: data.categories.course_category as string | undefined,
          taste_profile: data.categories.taste_profile as string | string[] | undefined,
          secondary_dietary_restrictions: data.categories.secondary_dietary_restrictions as string[] | undefined
        },
        user_id: data.user_id
      };
      
      return recipeData;
    },
    enabled: !!id
  });

  const {
    formData,
    updateFormField,
    handleSubmit,
    isSubmitting
  } = useRecipeForm({
    initialData: recipe,
    recipeId: id,
    mode: 'edit',
  });

  // Handle error states
  if (error) {
    return (
      <PageLayout>
        <ErrorState 
          message={error instanceof Error ? error.message : 'Error loading recipe'}
          onBack={() => navigate('/recipes')} 
        />
      </PageLayout>
    );
  }

  if (isLoading) {
    return (
      <PageLayout>
        <LoadingState />
      </PageLayout>
    );
  }

  if (!recipe) {
    return (
      <PageLayout>
        <ErrorState 
          message="Recipe not found" 
          onBack={() => navigate('/recipes')} 
        />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => navigate(`/recipes/${id}`)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Recipe
      </Button>

      <Card className="overflow-hidden rounded-[48px]">
        <CardContent className="p-6">
          <RecipeForm 
            formData={formData}
            updateFormField={updateFormField}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            onCancel={() => navigate(`/recipes/${id}`)}
            mode="edit"
          />
        </CardContent>
      </Card>
    </PageLayout>
  );
}
