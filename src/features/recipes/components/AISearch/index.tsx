import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowLeft, Bot } from "lucide-react";
import { RecipeSearchForm } from "@/components/recipes/RecipeSearchForm";
import { RecipeDisplay } from "@/components/recipes/RecipeDisplay";
import { ImageUploadOrGenerate } from "@/components/recipes/ImageUploadOrGenerate";
import { useAISearch } from '../../hooks/useAISearch';

export default function AISearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState<string>("pl");
  const [generateImage, setGenerateImage] = useState(false);
  const [measurementSystem, setMeasurementSystem] = useState<'metric' | 'imperial'>('metric');

  const {
    isSearching,
    suggestedRecipe,
    chosenPortions,
    isGeneratingImage,
    searchRecipe,
    saveRecipe,
    setIsSearching,
    setSuggestedRecipe,
    setChosenPortions,
    handleImageGenerated
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
            <div className="mb-4">
              <ImageUploadOrGenerate
                onImageSelected={(imageUrl) => {
                  if (suggestedRecipe) {
                    setSuggestedRecipe({
                      ...suggestedRecipe,
                      imageUrl: imageUrl
                    });
                  }
                }}
                title={suggestedRecipe?.title}
                disabled={isSearching}
              />
            </div>

            <RecipeSearchForm
              query={query}
              setQuery={setQuery}
              language={language}
              setLanguage={setLanguage}
              generateImage={generateImage}
              setGenerateImage={setGenerateImage}
              onSubmit={handleSearch}
              isLoading={isSearching}
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