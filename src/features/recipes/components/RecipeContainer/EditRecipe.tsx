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
      
      return data;
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

      <Card>
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