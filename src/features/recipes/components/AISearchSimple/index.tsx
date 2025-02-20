import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowLeft, Bot, AlertCircle } from "lucide-react";
import { RecipeSearchForm } from "@/components/recipes/RecipeSearchForm";
import { RecipeDisplay } from "@/components/recipes/RecipeDisplay";
import { useAISearch } from '../../hooks/useAISearch';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

export default function AISearchSimplePage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState<string>("pl");
  const [generateImage, setGenerateImage] = useState(false);
  const [measurementSystem, setMeasurementSystem] = useState<'metric' | 'imperial'>('metric');
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const {
    isSearching,
    suggestedRecipe,
    chosenPortions,
    searchRecipe,
    saveRecipe,
    setIsSearching,
    setSuggestedRecipe,
    setChosenPortions,
  } = useAISearch();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setSuggestedRecipe(null);
    setError(null);
    
    try {
      await searchRecipe.mutateAsync({ query, language, generateImage });
    } catch (error: any) {
      console.error('Search error:', error);
      
      // Handle specific error cases
      if (error.message?.includes('503 Service Unavailable') || 
          error.message?.includes('model is overloaded')) {
        setError('The AI service is currently overloaded. Please try again in a few moments.');
      } else if (error.message?.includes('500')) {
        setError('An error occurred while processing your request. Please try again.');
      } else {
        setError('Something went wrong. Please try again later.');
      }

      toast({
        variant: "destructive",
        title: "Search Failed",
        description: "Unable to process your recipe request at this time. Please try again later.",
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="outline"
          onClick={() => navigate("/recipes")}
          className="mb-6 hover:shadow-sm transition-all"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Recipes
        </Button>

        <Card className="mb-8">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <CardTitle>AI Recipe Search</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              Describe what you'd like to cook and our AI will suggest a recipe
            </p>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <RecipeSearchForm
              query={query}
              setQuery={setQuery}
              language={language}
              setLanguage={setLanguage}
              generateImage={generateImage}
              setGenerateImage={setGenerateImage}
              onSubmit={handleSearch}
              isLoading={isSearching}
              simpleMode={true}
            />
          </CardContent>
        </Card>

        {suggestedRecipe && (
          <RecipeDisplay
            recipe={suggestedRecipe}
            portions={chosenPortions}
            onPortionsChange={setChosenPortions}
            measurementSystem={measurementSystem}
            onMeasurementSystemChange={setMeasurementSystem}
            onSave={() => saveRecipe.mutate()}
            isSaving={saveRecipe.isPending}
          />
        )}
      </div>
    </div>
  );
} 