
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Image as ImageIcon } from 'lucide-react';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import ImageGenerator from '@/components/ImageGenerator';
import { useUserPreferences, LanguageCode } from '@/hooks/use-user-preferences';
import { RecipeDisplay } from '@/components/recipes/RecipeDisplay';
import { useAISearch } from '../../hooks/useAISearch';

const SUPPORTED_LANGUAGES = {
  en: 'English',
  pl: 'Polish',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  ru: 'Russian',
  uk: 'Ukrainian'
} as const;

export function AIRecipeSearch() {
  const [query, setQuery] = useState('');
  const { preferences } = useUserPreferences();
  const [language, setLanguage] = useState<LanguageCode>(preferences.language);
  const [generateImage, setGenerateImage] = useState(false);
  const [measurementSystem, setMeasurementSystem] = useState<'metric' | 'imperial'>(
    preferences.measurementSystem || 'metric'
  );

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

  // Update language when user preferences change
  useEffect(() => {
    setLanguage(preferences.language);
  }, [preferences.language]);

  const handleSearch = async () => {
    if (!query.trim()) {
      return;
    }

    setIsSearching(true);
    setSuggestedRecipe(null);
    
    try {
      await searchRecipe.mutateAsync({ query, language });
      
      if (generateImage && suggestedRecipe) {
        // Handle image generation if needed
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleEditOrGenerate = () => {
    // Placeholder for edit/generate functionality
    console.log("Edit or generate clicked");
  };
  
  const handleBack = () => {
    // Placeholder for back functionality
    console.log("Back clicked");
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden rounded-[48px]">
        <CardContent className="p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">AI Recipe Search</h1>
          
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1">
                <Input
                  placeholder="e.g., Find a vegan lasagna recipe"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full text-lg"
                />
              </div>
              <div className="flex flex-col sm:flex-row md:flex-row gap-3 sm:w-auto">
                <Select
                  value={language}
                  onValueChange={(value: LanguageCode) => setLanguage(value)}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
                      <SelectItem key={code} value={code as LanguageCode}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleSearch} 
                  disabled={isSearching}
                  className="w-full sm:w-auto"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    'Search'
                  )}
                </Button>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="generate-image"
                checked={generateImage}
                onCheckedChange={setGenerateImage}
              />
              <Label htmlFor="generate-image" className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Generate recipe image
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {suggestedRecipe && (
        <RecipeDisplay
          recipe={suggestedRecipe}
          scaledRecipe={suggestedRecipe}
          chosenPortions={chosenPortions}
          onPortionsChange={setChosenPortions}
          measurementSystem={measurementSystem}
          onMeasurementSystemChange={() => setMeasurementSystem(prev => 
            prev === 'metric' ? 'imperial' : 'metric'
          )}
          onSave={() => saveRecipe.mutate()}
          isSaving={saveRecipe.isPending}
          onEditOrGenerate={handleEditOrGenerate}
          onBack={handleBack}
        />
      )}

      {generateImage && suggestedRecipe && !suggestedRecipe.imageUrl && (
        <ImageGenerator
          prompt={`${suggestedRecipe.title}: ${suggestedRecipe.description}`}
          embedded={true}
          onImageGenerated={(imageUrl) => {
            setSuggestedRecipe(prev => prev ? { ...prev, imageUrl } : null);
          }}
        />
      )}
    </div>
  );
} 
