
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowLeft, Bot } from "lucide-react";
import { RecipeSearchForm } from "@/components/recipes/RecipeSearchForm";
import { RecipeDisplay } from "@/components/recipes/RecipeDisplay";
import { ImageUploadOrGenerate } from "@/components/recipes/ImageUploadOrGenerate";
import { useAISearch } from '../../hooks/useAISearch';
import { PageLayout } from '../RecipeContainer/PageLayout';

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

  const handleMeasurementSystemChange = () => {
    setMeasurementSystem(prev => prev === 'metric' ? 'imperial' : 'metric');
  };

  const handleEditOrGenerate = () => {
    // Placeholder for edit/generate functionality
    console.log("Edit or generate clicked");
  };
  
  const handleBack = () => {
    navigate("/recipes");
  };

  return (
    <PageLayout>
      <Button
        variant="outline"
        onClick={() => navigate("/recipes")}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Recipes
      </Button>

      <Card className="overflow-hidden rounded-[48px] mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bot className="mr-2 h-5 w-5" />
            AI Recipe Search
          </CardTitle>
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
          scaledRecipe={suggestedRecipe}
          chosenPortions={chosenPortions}
          onPortionsChange={setChosenPortions}
          measurementSystem={measurementSystem}
          onMeasurementSystemChange={handleMeasurementSystemChange}
          onSave={() => saveRecipe.mutate()}
          isSaving={saveRecipe.isPending}
          onEditOrGenerate={handleEditOrGenerate}
          onBack={handleBack}
          isGeneratingImage={isGeneratingImage}
        />
      )}
    </PageLayout>
  );
} 
