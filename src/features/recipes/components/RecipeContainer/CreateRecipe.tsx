import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRecipeForm } from "../../hooks/useRecipeForm";
import RecipeForm from "../RecipeForm";
import { PageLayout } from "./PageLayout";

export function CreateRecipeContainer() {
  const navigate = useNavigate();
  
  const {
    formData,
    updateFormField,
    handleSubmit,
    isSubmitting
  } = useRecipeForm({
    mode: 'create',
  });

  return (
    <PageLayout>
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
          <RecipeForm 
            formData={formData}
            updateFormField={updateFormField}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            onCancel={() => navigate("/recipes")}
            mode="create"
          />
        </CardContent>
      </Card>
    </PageLayout>
  );
} 