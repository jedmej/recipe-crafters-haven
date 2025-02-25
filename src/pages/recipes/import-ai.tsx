import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowLeft, Bot, ImageIcon, Tags } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SUPPORTED_LANGUAGES } from "@/types/recipe";
import ImageGenerator from '@/components/ImageGenerator';
import { Switch } from "@/components/ui/switch";
import { ImageUploadOrGenerate } from "@/components/recipes/ImageUploadOrGenerate";
import { RecipeData } from "@/types/recipe";
import { Badge } from "@/components/ui/badge";
import { useUserPreferences } from "@/hooks/use-user-preferences";

export default function ImportRecipeAIPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { preferences } = useUserPreferences();
  const [recipeUrl, setRecipeUrl] = useState("");
  const [language, setLanguage] = useState(preferences.language);
  const [isImporting, setIsImporting] = useState(false);
  const [recipeTitle, setRecipeTitle] = useState<string | null>(null);
  const [recipeImage, setRecipeImage] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  // Update language when user preferences change
  useEffect(() => {
    setLanguage(preferences.language);
  }, [preferences.language]);

  const importRecipe = useMutation({
    mutationFn: async (data: { url: string; language: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("User not authenticated");

      // Call Gemini AI edge function with language
      const { data: recipeData, error } = await supabase.functions.invoke('ai-recipe-import', {
        body: { 
          url: data.url, 
          targetLanguage: data.language,
          measurementSystem: preferences.measurementSystem
        }
      });

      if (error) throw error;
      if (!recipeData) throw new Error('No recipe data returned');

      setRecipeTitle(recipeData.title);
      if (recipeData.categories) {
        setCategories(recipeData.categories);
      }
      return await saveRecipeToDatabase(recipeData, session.user.id, data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      navigate(`/recipes/${data.id}`);
      toast({
        title: "Recipe imported and translated successfully!",
        description: "The recipe has been added to your collection.",
      });
    },
    onError: (error: Error) => {
      console.error('Import error:', error);
      toast({
        variant: "destructive",
        title: "Import failed",
        description: "We couldn't import or translate this recipe. Please try another URL or a different language.",
      });
    }
  });

  const saveRecipeToDatabase = async (recipeData: RecipeData, userId: string, data: { url: string; language: string }) => {
    const { data: savedRecipe, error: insertError } = await supabase
      .from('recipes')
      .insert([{
        ...recipeData,
        user_id: userId,
        source_url: data.url,
        language: data.language,
        image_url: recipeImage,
        categories: categories
      }])
      .select()
      .single();

    if (insertError) throw insertError;
    return savedRecipe;
  };

  const handleImageSelected = (imageUrl: string) => {
    setRecipeImage(imageUrl);
    toast({
      title: "Image added",
      description: "The image will be saved with your recipe.",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateUrl(recipeUrl)) {
      toast({
        variant: "destructive",
        title: "Invalid URL",
        description: "Please enter a valid URL starting with http:// or https://",
      });
      return;
    }

    setIsImporting(true);
    try {
      await importRecipe.mutateAsync({ url: recipeUrl, language });
    } finally {
      setIsImporting(false);
    }
  };

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          size="sm"
          className="mb-6"
          onClick={() => navigate("/recipes")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Recipes
        </Button>

        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
          Import Recipe
        </h1>

        <Card className="hover:shadow-lg transition-all duration-200">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <CardTitle className="text-xl font-semibold">Import Recipe with AI</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Recipe URL
                </label>
                <Input
                  type="url"
                  value={recipeUrl}
                  onChange={(e) => setRecipeUrl(e.target.value)}
                  placeholder="https://example.com/recipe"
                  required
                  className="w-full"
                  disabled={isImporting}
                />
                <p className="text-sm text-muted-foreground">
                  Enter any recipe URL and our AI will extract the recipe details
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Preferred Language
                </label>
                <Select 
                  value={language} 
                  onValueChange={setLanguage}
                  disabled={isImporting}
                >
                  <SelectTrigger className="w-full">
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
                <p className="text-sm text-muted-foreground">
                  Choose the language you want the recipe to be translated into
                </p>
              </div>

              {categories.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none flex items-center gap-2">
                    <Tags className="h-4 w-4" />
                    Categories
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category, index) => (
                      <Badge key={index} variant="secondary">
                        {category}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    AI-detected categories for this recipe
                  </p>
                </div>
              )}

              <ImageUploadOrGenerate
                onImageSelected={handleImageSelected}
                title={recipeTitle || undefined}
                disabled={isImporting}
              />

              <Alert variant="default" className="bg-muted">
                <AlertDescription>
                  Our AI will extract and translate the recipe information, including categories, from the provided URL.
                </AlertDescription>
              </Alert>

              <Button 
                type="submit" 
                className="w-full"
                disabled={isImporting}
              >
                {isImporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing Recipe...
                  </>
                ) : (
                  <>
                    <Bot className="mr-2 h-4 w-4" />
                    Import with AI
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
