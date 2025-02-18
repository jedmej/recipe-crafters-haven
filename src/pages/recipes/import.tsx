
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function ImportRecipePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [url, setUrl] = useState("");

  const importRecipe = useMutation({
    mutationFn: async (url: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const response = await supabase.functions.invoke('import-recipe', {
        body: { url }
      });

      if (response.error) {
        console.error('Import error:', response.error);
        throw new Error(response.error.message || 'Failed to import recipe');
      }
      
      if (!response.data) {
        throw new Error('No recipe data returned from import');
      }

      const { data: recipeData, error: insertError } = await supabase
        .from('recipes')
        .insert([{
          ...response.data,
          user_id: user.id,
          source_url: url
        }])
        .select()
        .single();

      if (insertError) {
        console.error('Database error:', insertError);
        throw insertError;
      }

      return recipeData;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      navigate(`/recipes/${data.id}`);
      toast({
        title: "Recipe imported",
        description: "The recipe has been successfully imported.",
      });
    },
    onError: (error: Error) => {
      let errorMessage = error.message;
      
      // Make error messages more user-friendly
      if (errorMessage.includes('No content found')) {
        errorMessage = "Could not find recipe content on this page. Please make sure the URL points to a valid recipe page.";
      } else if (errorMessage.includes('404')) {
        errorMessage = "The recipe page could not be found. Please check if the URL is correct.";
      } else if (errorMessage.includes('timeout')) {
        errorMessage = "The request timed out. Please try again or try a different URL.";
      }
      
      toast({
        variant: "destructive",
        title: "Import failed",
        description: errorMessage,
      });
    }
  });

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateUrl(url)) {
      toast({
        variant: "destructive",
        title: "Invalid URL",
        description: "Please enter a valid URL starting with http:// or https://",
      });
      return;
    }

    await importRecipe.mutateAsync(url);
  };

  return (
    <div className="container mx-auto py-8">
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
          <CardTitle>Import Recipe from URL</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Recipe URL</label>
              <Input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/recipe"
                required
                className="w-full"
                disabled={importRecipe.isPending}
              />
              <p className="text-sm text-muted-foreground">
                Enter the URL of any public recipe page to import its contents
              </p>
            </div>

            <Alert>
              <AlertDescription>
                Make sure the URL is publicly accessible and contains a recipe with clear ingredients and instructions.
              </AlertDescription>
            </Alert>

            <Button 
              type="submit" 
              className="w-full"
              disabled={importRecipe.isPending || !url.trim()}
            >
              {importRecipe.isPending ? (
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
    </div>
  );
}
