import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowLeft, Bot } from "lucide-react";
import { RecipeSearchForm } from "@/components/recipes/RecipeSearchForm";
import { RecipeDisplay } from "@/components/recipes/RecipeDisplay";
import { useAISearch } from '../../hooks/useAISearch';
import { PageLayout } from './PageLayout';

export function AISearchContainer() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState<string>("pl");
  const [generateImage, setGenerateImage] = useState(false);
  const [measurementSystem, setMeasurementSystem] = useState<'metric' | 'imperial'>('metric');

  const {
    isSearching,
    suggestedRecipe,
    chosenPortions,
    isRegenerating,
    searchRecipe,
    saveRecipe,
    setIsSearching,
    setSuggestedRecipe,
    setChosenPortions,
    setIsRegenerating,
  } = useAISearch();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setSuggestedRecipe(null);
    
    try {
      await searchRecipe.mutateAsync({ query, language });
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleRegenerate = async () => {
    if (!query) return;
    setIsRegenerating(true);
    try {
      await searchRecipe.mutateAsync({ query, language });
    } catch (error) {
      console.error('Regenerate error:', error);
    } finally {
      setIsRegenerating(false);
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
          scaledRecipe={suggestedRecipe}
          chosenPortions={chosenPortions}
          onPortionsChange={setChosenPortions}
          measurementSystem={measurementSystem}
          onMeasurementSystemChange={() => setMeasurementSystem(prev => prev === 'metric' ? 'imperial' : 'metric')}
          onSave={() => saveRecipe.mutate()}
          isSaving={saveRecipe.isPending}
          onRegenerate={handleRegenerate}
          isRegenerating={isRegenerating}
          onImageUpdate={(imageUrl) => setSuggestedRecipe(prev => prev ? { ...prev, imageUrl } : null)}
        />
      )}
    </PageLayout>
  );
} 