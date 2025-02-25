import { useState, useReducer, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Bot, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SUPPORTED_LANGUAGES } from "@/features/recipes/types";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { ImageUploadOrGenerate } from "@/components/recipes/ImageUploadOrGenerate";
import { Badge } from "@/components/ui/badge";
import { PageLayout } from "./PageLayout";

// Form state reducer
type FormState = {
  recipeUrl: string;
  language: string;
  recipeTitle: string | null;
  recipeImage: string | null;
  categories: string[];
  isImporting: boolean;
};

type FormAction = 
  | { type: 'SET_URL', payload: string }
  | { type: 'SET_LANGUAGE', payload: string }
  | { type: 'SET_IMAGE', payload: string | null }
  | { type: 'SET_TITLE', payload: string | null }
  | { type: 'SET_CATEGORIES', payload: string[] }
  | { type: 'SET_IMPORTING', payload: boolean }
  | { type: 'RESET_FORM' };

const initialFormState: FormState = {
  recipeUrl: "",
  language: "",
  recipeTitle: null,
  recipeImage: null,
  categories: [],
  isImporting: false
};

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_URL': return { ...state, recipeUrl: action.payload };
    case 'SET_LANGUAGE': return { ...state, language: action.payload };
    case 'SET_IMAGE': return { ...state, recipeImage: action.payload };
    case 'SET_TITLE': return { ...state, recipeTitle: action.payload };
    case 'SET_CATEGORIES': return { ...state, categories: action.payload };
    case 'SET_IMPORTING': return { ...state, isImporting: action.payload };
    case 'RESET_FORM': return initialFormState;
    default: return state;
  }
}

export function ImportAIContainer() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { preferences } = useUserPreferences();
  
  // Initialize form state
  const [formState, dispatch] = useReducer(formReducer, {
    ...initialFormState,
    language: preferences.language || "en"
  });
  
  const { recipeUrl, language, recipeTitle, recipeImage, categories, isImporting } = formState;
  
  // Update language when user preferences change
  useEffect(() => {
    dispatch({ type: 'SET_LANGUAGE', payload: preferences.language || "en" });
  }, [preferences.language]);
  
  // Import mutation
  const importRecipe = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Call AI import function
      const { data, error } = await supabase.functions.invoke('ai-recipe-import', {
        body: { 
          url: recipeUrl, 
          targetLanguage: language,
          measurementSystem: preferences.measurementSystem || "metric"
        }
      });

      if (error) throw error;
      if (!data) throw new Error('No recipe data returned');
      
      // Set recipe title and extract categories
      dispatch({ type: 'SET_TITLE', payload: data.title });
      if (data.categories) {
        const categoryList = [];
        if (data.categories.meal_type) categoryList.push(data.categories.meal_type);
        if (data.categories.cuisine_type) categoryList.push(data.categories.cuisine_type);
        if (data.categories.difficulty_level) categoryList.push(data.categories.difficulty_level);
        dispatch({ type: 'SET_CATEGORIES', payload: categoryList });
      }
      
      // Save recipe in database
      const { data: recipeData, error: saveError } = await supabase
        .from('recipes')
        .insert([{
          title: data.title,
          description: data.description || "",
          ingredients: data.ingredients || [],
          instructions: data.instructions || [],
          prep_time: data.prep_time || 0,
          cook_time: data.cook_time || 0,
          estimated_calories: data.estimated_calories || 0,
          servings: data.suggested_portions || 1,
          image_url: recipeImage,
          source_url: recipeUrl,
          user_id: session.user.id,
          language: language,
          categories: data.categories || {}
        }])
        .select()
        .single();
        
      if (saveError) throw saveError;
      return recipeData;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      navigate(`/recipes/${data.id}`);
      toast({
        title: "Recipe imported successfully!",
        description: "The recipe has been added to your collection."
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Import failed",
        description: error.message
      });
    },
    onSettled: () => {
      dispatch({ type: 'SET_IMPORTING', payload: false });
    }
  });
  
  // Handle import submission
  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateUrl(recipeUrl)) {
      toast({
        variant: "destructive",
        title: "Invalid URL",
        description: "Please enter a valid URL"
      });
      return;
    }
    
    dispatch({ type: 'SET_IMPORTING', payload: true });
    importRecipe.mutate();
  };
  
  // URL validation
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
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bot className="mr-2 h-5 w-5" />
                Import Recipe with AI
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleImport} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Recipe URL</label>
                  <Input
                    placeholder="https://example.com/your-recipe"
                    value={recipeUrl}
                    onChange={(e) => dispatch({ type: 'SET_URL', payload: e.target.value })}
                    disabled={isImporting}
                  />
                  <p className="text-sm text-muted-foreground">
                    Enter the URL of any recipe you'd like to import
                  </p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Import Language</label>
                  <Select 
                    value={language} 
                    onValueChange={(value) => dispatch({ type: 'SET_LANGUAGE', payload: value })}
                    disabled={isImporting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
                        <SelectItem key={code} value={code}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    The AI will translate the recipe to this language
                  </p>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isImporting || !recipeUrl.trim()}
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing Recipe...
                    </>
                  ) : (
                    'Import Recipe'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ImageIcon className="mr-2 h-5 w-5" />
                Recipe Image
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <ImageUploadOrGenerate
                  onImageSelected={(imageUrl) => dispatch({ type: 'SET_IMAGE', payload: imageUrl })}
                  title={recipeTitle || ""}
                  disabled={isImporting || !recipeTitle}
                  currentImage={recipeImage}
                />
                
                {recipeTitle && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Recipe Details</p>
                    <div>
                      <p className="font-medium">{recipeTitle}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {categories.map((category, index) => (
                          <Badge key={index} variant="outline">{category}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
} 