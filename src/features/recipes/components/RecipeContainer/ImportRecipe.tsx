import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bot, Loader2 } from "lucide-react";
import { useRecipeForm } from "../../hooks/useRecipeForm";
import RecipeForm from "../RecipeForm";
import { PageLayout } from "./PageLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SUPPORTED_LANGUAGES } from "@/types/recipe";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { AiRecipeResponse } from "../../types";

export function ImportRecipeContainer() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { preferences } = useUserPreferences();
  
  const [isImporting, setIsImporting] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [language, setLanguage] = useState(preferences.language || "en");
  const [importError, setImportError] = useState("");
  
  const {
    formData,
    updateFormField,
    handleSubmit,
    isSubmitting,
    resetForm
  } = useRecipeForm({
    mode: 'import',
  });

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateUrl(importUrl)) {
      setImportError("Please enter a valid URL");
      return;
    }
    
    setImportError("");
    setIsImporting(true);
    
    try {
      // Call Gemini AI edge function with language
      const { data: recipeData, error } = await supabase.functions.invoke('ai-recipe-import', {
        body: { 
          url: importUrl, 
          targetLanguage: language,
          measurementSystem: preferences.measurementSystem
        }
      });

      if (error) throw error;
      if (!recipeData) throw new Error('No recipe data returned');
      
      const typedData = recipeData as AiRecipeResponse;
      
      // Update the form data with the imported recipe
      updateFormField("title", typedData.title);
      updateFormField("description", typedData.description || "");
      updateFormField("ingredients", typedData.ingredients || []);
      updateFormField("instructions", typedData.instructions || []);
      updateFormField("prep_time", typedData.prep_time || 0);
      updateFormField("cook_time", typedData.cook_time || 0);
      updateFormField("estimated_calories", typedData.estimated_calories || 0);
      updateFormField("servings", typedData.suggested_portions || 1);
      updateFormField("source_url", importUrl);
      updateFormField("language", language);
      
      if (typedData.categories) {
        updateFormField("categories", {
          meal_type: typedData.categories.meal_type || "",
          dietary_restrictions: typedData.categories.dietary_restrictions?.join(", ") || "",
          difficulty_level: typedData.categories.difficulty_level || "",
          cuisine_type: typedData.categories.cuisine_type || "",
          cooking_method: typedData.categories.cooking_method?.join(", ") || ""
        });
      }
      
      toast({
        title: "Recipe imported",
        description: "Successfully imported and translated the recipe. You can now review and save it.",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import recipe';
      setImportError(errorMessage);
      toast({
        variant: "destructive",
        title: "Import failed",
        description: errorMessage,
      });
    } finally {
      setIsImporting(false);
    }
  };
  
  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

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

      <div className="space-y-6">
        <Card className="overflow-hidden rounded-[48px]">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bot className="mr-2 h-5 w-5" /> 
              Import Recipe from URL
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleImport} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url">Recipe URL</Label>
                <Input
                  id="url"
                  placeholder="https://example.com/recipe"
                  value={importUrl}
                  onChange={e => setImportUrl(e.target.value)}
                  disabled={isImporting}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="language">Import Language</Label>
                <Select 
                  value={language} 
                  onValueChange={setLanguage}
                  disabled={isImporting}
                >
                  <SelectTrigger id="language">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
                      <SelectItem key={code} value={code}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {importError && (
                <Alert variant="destructive">
                  <AlertDescription>{importError}</AlertDescription>
                </Alert>
              )}
              
              <Button type="submit" disabled={isImporting || !importUrl}>
                {isImporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing Recipe...
                  </>
                ) : (
                  "Import Recipe"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        {/* Only show the form if we have recipe data */}
        {formData.title && (
          <Card className="overflow-hidden rounded-[48px]">
            <CardHeader>
              <CardTitle>Review and Save Recipe</CardTitle>
            </CardHeader>
            <CardContent>
              <RecipeForm 
                formData={formData}
                updateFormField={updateFormField}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                onCancel={() => {
                  resetForm();
                  navigate("/recipes");
                }}
                mode="import"
              />
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  );
} 