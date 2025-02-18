
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowLeft, Bot } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function ImportRecipeAIPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [url, setUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const importRecipe = useMutation({
    mutationFn: async (url: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("User not authenticated");

      // Call Gemini AI edge function
      const { data, error } = await supabase.functions.invoke('ai-recipe-import', {
        body: { url }
      });

      if (error) throw error;
      if (!data) throw new Error('No recipe data returned');

      // Save to database
      const { data: savedRecipe, error: insertError } = await supabase
        .from('recipes')
        .insert([{
          ...data,
          user_id: session.user.id,
          source_url: url
        }])
        .select()
        .single();

      if (insertError) throw insertError;
      return savedRecipe;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      navigate(`/recipes/${data.id}`);
      toast({
        title: "Recipe imported successfully via AI!",
        description: "The recipe has been added to your collection.",
      });
    },
    onError: (error: Error) => {
      console.error('Import error:', error);
      toast({
        variant: "destructive",
        title: "Import failed",
        description: "We couldn't fetch the recipe. Please try another URL or enter it manually.",
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

    setIsImporting(true);
    try {
      await importRecipe.mutateAsync(url);
    } finally {
      setIsImporting(false);
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
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            <CardTitle>Import Recipe with AI</CardTitle>
          </div>
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
                disabled={isImporting}
              />
              <p className="text-sm text-muted-foreground">
                Enter any recipe URL and our AI will extract the recipe details
              </p>
            </div>

            <Alert>
              <AlertDescription>
                Our AI will attempt to extract the recipe information from the provided URL. 
                This experimental feature might not work with all websites.
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
  );
}
