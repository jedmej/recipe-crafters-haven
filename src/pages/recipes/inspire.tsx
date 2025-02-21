import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2, Save, RefreshCw, Clock, Timer, Flame } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import ImageGenerator from "@/components/ImageGenerator";

interface RecipeData {
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  prep_time: number;
  cook_time: number;
  estimated_calories: number;
  suggested_portions: number;
  portion_description: string;
  image_url?: string;
}

const LANGUAGE_CODES = {
  'English': 'en',
  'Spanish': 'es',
  'French': 'fr',
  'Italian': 'it',
  'German': 'de',
  'Polish': 'pl'
};

export default function InspirePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedRecipe, setGeneratedRecipe] = useState<RecipeData | null>(null);
  const [mealType, setMealType] = useState<string>("");
  const [dietary, setDietary] = useState<string>("");
  const [difficulty, setDifficulty] = useState<string>("");
  const [cuisine, setCuisine] = useState<string>("");
  const [cookingMethod, setCookingMethod] = useState<string>("");
  const [calories, setCalories] = useState<number[]>([500]);
  const [language, setLanguage] = useState<string>("English");
  const [generateImage, setGenerateImage] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const mealTypes = [
    "Breakfast", "Brunch", "Lunch", "Dinner", "Snacks", "Dessert", "Appetizer"
  ];

  const dietaryRestrictions = [
    "None", "Vegetarian", "Vegan", "Gluten-free", "Dairy-free", 
    "Keto", "Paleo", "Halal", "Kosher"
  ];

  const difficultyLevels = ["Easy", "Medium", "Hard"];

  const cuisineTypes = [
    "Italian", "Asian", "Mexican", "Mediterranean", "American",
    "Indian", "Chinese", "Thai", "Middle Eastern", "Japanese", "French", "Other"
  ];

  const cookingMethods = [
    "Oven-baked", "Stovetop", "Air Fryer", "Slow Cooker",
    "Instant Pot", "Grill", "Sous-vide", "Microwave", "Other"
  ];

  const languages = Object.keys(LANGUAGE_CODES);

  const generateRecipe = useMutation({
    mutationFn: async () => {
      const preferences = [];
      if (mealType) preferences.push(`meal type: ${mealType}`);
      if (dietary && dietary !== "none") preferences.push(`dietary restriction: ${dietary}`);
      if (difficulty) preferences.push(`difficulty level: ${difficulty}`);
      if (cuisine) preferences.push(`cuisine type: ${cuisine}`);
      if (cookingMethod) preferences.push(`cooking method: ${cookingMethod}`);
      if (calories[0]) preferences.push(`maximum calories per serving: ${calories[0]}`);

      const query = `Create a recipe with these preferences: ${preferences.join(", ")}`;
      
      const response = await supabase.functions.invoke('recipe-chat', {
        body: { 
          query,
          language: LANGUAGE_CODES[language as keyof typeof LANGUAGE_CODES]
        }
      });

      if (!response.data?.success) {
        throw new Error(response.error?.message || 'Failed to generate recipe');
      }

      let recipeData = response.data.data as RecipeData;
      console.log('Recipe generated:', recipeData);

      // Generate image if enabled
      if (generateImage) {
        console.log('Image generation enabled, starting process...');
        try {
          let imagePrompt;
          // If the recipe is not in English, get an English version for better image generation
          if (language !== 'English') {
            console.log('Non-English recipe, getting English version for image prompt...');
            const englishResponse = await supabase.functions.invoke('recipe-chat', {
              body: { 
                query,
                language: 'en'
              }
            });
            
            if (englishResponse.data?.success && englishResponse.data?.data) {
              imagePrompt = `${englishResponse.data.data.title}: ${englishResponse.data.data.description}`;
            } else {
              console.log('Failed to get English version, using original language for prompt');
              imagePrompt = `${recipeData.title}: ${recipeData.description}`;
            }
          } else {
            imagePrompt = `${recipeData.title}: ${recipeData.description}`;
          }

          setIsGeneratingImage(true);
        } catch (error) {
          console.error('Error generating image:', error);
          toast({
            title: "Warning",
            description: "Recipe was generated but image generation failed. You can try regenerating later.",
            variant: "destructive",
          });
        }
      }

      return recipeData;
    },
    onSuccess: (recipeData) => {
      console.log('Setting generated recipe:', recipeData);
      setGeneratedRecipe(recipeData);
      toast({
        title: "Recipe generated",
        description: "Review the recipe and save it if you like it!",
      });
    },
    onError: (error: Error) => {
      console.error('Recipe generation error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to generate recipe. Please try again.",
      });
    }
  });

  const saveRecipe = async () => {
    if (!generatedRecipe) return;

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data: savedRecipe, error: saveError } = await supabase
        .from('recipes')
        .insert([{
          title: generatedRecipe.title,
          description: generatedRecipe.description,
          ingredients: generatedRecipe.ingredients,
          instructions: generatedRecipe.instructions,
          prep_time: generatedRecipe.prep_time,
          cook_time: generatedRecipe.cook_time,
          estimated_calories: generatedRecipe.estimated_calories,
          servings: generatedRecipe.suggested_portions,
          suggested_portions: generatedRecipe.suggested_portions,
          portion_size: generatedRecipe.suggested_portions,
          portion_description: generatedRecipe.portion_description,
          user_id: user.id,
          created_at: new Date().toISOString(),
          language: LANGUAGE_CODES[language as keyof typeof LANGUAGE_CODES],
          image_url: generatedRecipe.image_url
        }])
        .select()
        .single();

      if (saveError) throw saveError;

      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      navigate(`/recipes/${savedRecipe.id}`);
      toast({
        title: "Recipe saved",
        description: "Your recipe has been saved to your collection.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save recipe. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInspire = async () => {
    if (!mealType) {
      toast({
        variant: "destructive",
        title: "Missing meal type",
        description: "Please select a meal type to continue.",
      });
      return;
    }

    setIsGenerating(true);
    try {
      await generateRecipe.mutateAsync();
    } catch (error) {
      console.error('Error in handleInspire:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="flex items-center mb-4 sm:mb-6 lg:mb-8">
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-gray-100 transition-colors -ml-2"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            <span className="text-sm">Back</span>
          </Button>
        </div>

        <div className="w-full max-w-3xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight">Get Inspired</h1>
            <p className="mt-2 text-muted-foreground">
              Choose your preferences and let AI suggest the perfect recipe for you
            </p>
          </div>

          <Card className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Meal Type</Label>
                <Select value={mealType} onValueChange={setMealType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select meal type" />
                  </SelectTrigger>
                  <SelectContent>
                    {mealTypes.map((type) => (
                      <SelectItem key={type} value={type.toLowerCase()}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Dietary Restrictions</Label>
                <Select value={dietary} onValueChange={setDietary}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select dietary restrictions" />
                  </SelectTrigger>
                  <SelectContent>
                    {dietaryRestrictions.map((restriction) => (
                      <SelectItem key={restriction} value={restriction.toLowerCase()}>
                        {restriction}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Difficulty Level</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    {difficultyLevels.map((level) => (
                      <SelectItem key={level} value={level.toLowerCase()}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Cuisine Type</Label>
                <Select value={cuisine} onValueChange={setCuisine}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select cuisine" />
                  </SelectTrigger>
                  <SelectContent>
                    {cuisineTypes.map((type) => (
                      <SelectItem key={type} value={type.toLowerCase()}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Cooking Method</Label>
                <Select value={cookingMethod} onValueChange={setCookingMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select cooking method" />
                  </SelectTrigger>
                  <SelectContent>
                    {cookingMethods.map((method) => (
                      <SelectItem key={method} value={method.toLowerCase()}>
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang} value={lang}>
                        {lang}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4 md:col-span-2">
                <div className="flex justify-between">
                  <Label>Maximum Calories (per serving)</Label>
                  <span className="text-sm text-muted-foreground">
                    {calories[0]} kcal
                  </span>
                </div>
                <Slider
                  value={calories}
                  onValueChange={setCalories}
                  max={2000}
                  min={100}
                  step={50}
                  className="w-full"
                />
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="generate-image"
                    checked={generateImage}
                    onCheckedChange={setGenerateImage}
                    disabled={isGenerating || isGeneratingImage}
                  />
                  <Label htmlFor="generate-image">Generate AI image for recipe</Label>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button 
                className="w-full"
                size="lg"
                onClick={handleInspire}
                disabled={isGenerating || isGeneratingImage || isSaving}
              >
                {isGenerating || isGeneratingImage ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isGeneratingImage ? 'Generating Image...' : 'Generating Recipe...'}
                  </>
                ) : (
                  'Get Recipe Suggestion'
                )}
              </Button>
            </div>
          </Card>

          {generatedRecipe && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
              <div className="lg:col-span-8">
                <Card className="overflow-hidden">
                  <div className="p-6 lg:p-8">
                    <div className="flex justify-end gap-4 mb-6">
                      <Button
                        className="flex-1 sm:flex-initial"
                        onClick={saveRecipe}
                        disabled={isSaving || isGenerating || isGeneratingImage}
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Recipe
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleInspire}
                        disabled={isGenerating || isGeneratingImage || isSaving}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Regenerate
                      </Button>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">{generatedRecipe.title}</h1>
                        <p className="text-gray-600 mt-4 text-lg">{generatedRecipe.description}</p>
                      </div>
                      
                      {generatedRecipe.image_url && (
                        <div className="relative w-full h-[500px] rounded-xl overflow-hidden">
                          <img
                            src={generatedRecipe.image_url}
                            alt={generatedRecipe.title}
                            className="object-cover w-full h-full"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </div>

              <div className="lg:col-span-4">
                <Card>
                  <div className="p-6">
                    <div className="grid grid-cols-3 lg:grid-cols-1 gap-4">
                      <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
                        <Clock className="h-6 w-6 text-gray-500 mb-2" />
                        <p className="text-sm text-gray-500">Prep Time</p>
                        <p className="text-lg font-semibold">{generatedRecipe.prep_time} min</p>
                      </div>
                      <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
                        <Timer className="h-6 w-6 text-gray-500 mb-2" />
                        <p className="text-sm text-gray-500">Cook Time</p>
                        <p className="text-lg font-semibold">{generatedRecipe.cook_time} min</p>
                      </div>
                      <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
                        <Flame className="h-6 w-6 text-gray-500 mb-2" />
                        <p className="text-sm text-gray-500">Calories</p>
                        <p className="text-lg font-semibold">{generatedRecipe.estimated_calories} kcal</p>
                      </div>
                      <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500">Portions</p>
                        <p className="text-lg font-semibold">{generatedRecipe.suggested_portions} {generatedRecipe.portion_description}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="lg:col-span-6">
                <Card className="h-full">
                  <div className="p-6 lg:p-8">
                    <h3 className="text-2xl font-semibold mb-6">Ingredients</h3>
                    <ul className="list-none space-y-4">
                      {generatedRecipe.ingredients.map((ingredient, index) => (
                        <li key={index} className="flex items-center gap-4">
                          <span className="w-2 h-2 rounded-full bg-gray-500 flex-shrink-0" />
                          <span className="text-gray-700">{ingredient}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              </div>

              <div className="lg:col-span-6">
                <Card className="h-full">
                  <div className="p-6 lg:p-8">
                    <h3 className="text-2xl font-semibold mb-6">Instructions</h3>
                    <div className="space-y-4">
                      {generatedRecipe.instructions.map((instruction, index) => (
                        <div key={index} className="flex items-start gap-4 text-lg text-gray-700">
                          <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-700 font-medium">
                            {index + 1}
                          </span>
                          <span>{instruction}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {generateImage && generatedRecipe && !generatedRecipe.image_url && (
            <ImageGenerator
              prompt={`${generatedRecipe.title}: ${generatedRecipe.description}`}
              embedded={true}
              onImageGenerated={(imageUrl) => {
                setGeneratedRecipe(prev => prev ? { ...prev, image_url: imageUrl } : null);
                setIsGeneratingImage(false);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
} 