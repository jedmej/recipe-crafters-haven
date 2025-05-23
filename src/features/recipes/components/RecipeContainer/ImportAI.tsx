
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Bot, AlertCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SUPPORTED_LANGUAGES } from "@/types/recipe";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { PageLayout } from "./PageLayout";
import { useAISearch } from "../../hooks/useAISearch";
import { RecipeDisplay } from "@/components/recipes/RecipeDisplay";
import { LanguageCode } from "@/hooks/use-user-preferences";

export function ImportAIContainer() {
  const navigate = useNavigate();
  const location = useLocation();
  const { preferences } = useUserPreferences();
  
  // Get URL parameter from query string if it exists
  const queryParams = new URLSearchParams(location.search);
  const urlFromQuery = queryParams.get('url');
  
  // State for the URL input and language selection
  const [recipeUrl, setRecipeUrl] = useState(urlFromQuery || "");
  const [language, setLanguage] = useState<LanguageCode>(preferences.language || "en");
  const [error, setError] = useState<string | null>(null);
  const [measurementSystem, setMeasurementSystem] = useState<'metric' | 'imperial'>(
    preferences.measurementSystem || 'metric'
  );
  
  // Use the same AI search hook that powers the search feature
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
  
  // Auto-import if URL is provided in query params
  useEffect(() => {
    if (urlFromQuery && !suggestedRecipe && !isSearching) {
      // Set a small timeout to ensure component is fully mounted
      const timer = setTimeout(() => {
        handleImport({ preventDefault: () => {} } as React.FormEvent);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [urlFromQuery, suggestedRecipe, isSearching]);
  
  // URL validation
  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };
  
  // Handle import submission
  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateUrl(recipeUrl)) {
      setError("Please enter a valid URL");
      return;
    }
    
    setError(null);
    setIsSearching(true);
    setSuggestedRecipe(null);
    
    try {
      // Use the same searchRecipe mutation but with the URL as the query
      await searchRecipe.mutateAsync({ 
        query: `Extract recipe from this URL: ${recipeUrl}`, 
        language 
      });
    } catch (error: any) {
      console.error('Import error:', error);
      
      // Handle specific error cases
      if (error.message?.includes('503 Service Unavailable') || 
          error.message?.includes('model is overloaded')) {
        setError('The AI service is currently overloaded. Please try again in a few moments.');
      } else if (error.message?.includes('500')) {
        setError('An error occurred while processing your request. Please try again.');
      } else {
        setError('Sorry, we couldn\'t fetch this recipe from the URL. Please try another URL or enter it manually.');
      }
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleRegenerate = async () => {
    if (!recipeUrl) return;
    setIsRegenerating(true);
    try {
      await handleImport({ preventDefault: () => {} } as React.FormEvent);
    } catch (error) {
      console.error('Regenerate error:', error);
    } finally {
      setIsRegenerating(false);
    }
  };
  
  const handleImageUpdate = async (imageUrl: string): Promise<void> => {
    setSuggestedRecipe(prev => prev ? { ...prev, imageUrl } : null);
    return Promise.resolve();
  };

  return (
    <PageLayout>
      <div className="space-y-6">
        <Card className="overflow-hidden rounded-[48px] mb-8 bg-[#F5F5F5] border-none">
          <CardHeader>
            <CardTitle className="flex items-center text-3xl font-bold">
              <Bot className="mr-2 h-6 w-6" />
              Import Recipe with AI
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleImport} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Recipe URL</label>
                <Input
                  placeholder="https://example.com/your-recipe"
                  value={recipeUrl}
                  onChange={(e) => setRecipeUrl(e.target.value)}
                  disabled={isSearching}
                  className="bg-white border-gray-200 h-[48px] rounded-[500px]"
                />
                <p className="text-sm text-muted-foreground">
                  Enter the URL of any recipe you'd like to import
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Import Language</label>
                <Select 
                  value={language} 
                  onValueChange={(value) => setLanguage(value as LanguageCode)}
                  disabled={isSearching}
                >
                  <SelectTrigger className="bg-white border-gray-200 h-[48px] rounded-[500px]">
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
                  The AI will translate the recipe to this language
                </p>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-orange-500 hover:bg-orange-600 text-white h-[48px] rounded-[500px]"
                disabled={isSearching || !recipeUrl.trim()}
              >
                {isSearching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing Recipe...
                  </>
                ) : (
                  'Import Recipe'
                )}
              </Button>
            </form>
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
            onImageUpdate={handleImageUpdate}
            onEditOrGenerate={() => console.log("Edit clicked")}
            onBack={() => navigate("/recipes")}
          />
        )}
      </div>
    </PageLayout>
  );
}
