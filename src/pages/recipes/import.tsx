
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

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export default function ImportRecipePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [url, setUrl] = useState("");

  const callEdgeFunction = async (url: string, retryCount = 0): Promise<any> => {
    try {
      const { data, error } = await supabase.functions.invoke('import-recipe', {
        body: { url },
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (error) throw error;
      if (!data) throw new Error('No recipe data returned');
      
      return data;
    } catch (error) {
      console.error(`Edge function call attempt ${retryCount + 1} failed:`, error);
      
      if (retryCount < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return callEdgeFunction(url, retryCount + 1);
      }
      
      throw error;
    }
  };

  const importRecipe = useMutation({
    mutationFn: async (url: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("User not authenticated");

      // Call Edge Function with retry logic
      const recipeData = await callEdgeFunction(url);

      // Save to database
      const { data: savedRecipe, error: insertError } = await supabase
        .from('recipes')
        .insert([{
          ...recipeData,
          user_id: session.user.id,
          source_url: url
        }])
        .select()
        .single();

      if (insertError) {
        console.error('Database error:', insertError);
        throw insertError;
      }

      return savedRecipe;
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
      console.error('Import error:', error);
      
      let errorMessage = "Sorry, we couldn't fetch this recipe from the URL. Please try another URL or enter it manually.";
      
      if (error.message.includes('User not authenticated')) {
        errorMessage = "Please sign in to import recipes.";
      } else if (error.message.includes('Failed to fetch') || error.message.includes('network')) {
        errorMessage = "Connection error. Please check your internet connection and try again.";
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

    try {
      await importRecipe.mutateAsync(url);
    } catch (error) {
      console.error('Submit error:', error);
    }
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
