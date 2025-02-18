
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
import { GoogleGenerativeAI } from "@google/generative-ai";

export default function ImportRecipePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [url, setUrl] = useState("");

  const importRecipe = useMutation({
    mutationFn: async (url: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("User not authenticated");

      // Fetch webpage content
      const response = await fetch(url);
      const pageContent = await response.text();

      // Initialize Gemini
      const { data: { secret }, error: secretError } = await supabase
        .from('secrets')
        .select('value')
        .eq('name', 'GOOGLE_GEMINI_KEY')
        .single();
      
      if (secretError || !secret) {
        throw new Error('Recipe import service is not properly configured');
      }

      const genAI = new GoogleGenerativeAI(secret.value);
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

      // Process with Gemini
      const result = await model.generateContent({
        contents: [{
          parts: [{
            text: `Extract recipe information from this webpage content.
            Return ONLY a valid JSON object with these exact fields:
            {
              "title": "Recipe title",
              "description": "Brief recipe description",
              "ingredients": ["list of ingredients"],
              "instructions": ["step by step instructions"],
              "servings": 1
            }
            
            Webpage content:
            ${pageContent.slice(0, 10000)}
            
            Respond with ONLY the JSON object, no other text.`
          }]
        }]
      });

      const text = result.response.text();
      let recipeData;
      
      try {
        recipeData = JSON.parse(text);
      } catch (error) {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('Failed to parse recipe data');
        }
        recipeData = JSON.parse(jsonMatch[0]);
      }

      if (!recipeData || !recipeData.title || !recipeData.ingredients || !recipeData.instructions) {
        throw new Error('Invalid recipe data received');
      }

      // Save to database
      const { data: savedRecipe, error: insertError } = await supabase
        .from('recipes')
        .insert([{
          ...recipeData,
          user_id: session.user.id,
          source_url: url,
          image_url: '', // No image processing for now
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
      let errorMessage = "Sorry, we couldn't fetch this recipe from the URL. Please try another URL or enter it manually.";
      
      if (error.message.includes('User not authenticated')) {
        errorMessage = "Please sign in to import recipes.";
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
