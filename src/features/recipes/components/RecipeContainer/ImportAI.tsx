
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import { PageLayout } from './PageLayout';
import { RecipeDisplay } from '@/components/recipes/recipe-display';
import { useRecipeGeneration } from '../../hooks/useRecipeGeneration';
import { SUPPORTED_LANGUAGES } from '@/types/recipe';
import { useUserPreferences } from '@/hooks/use-user-preferences';

export function ImportAIContainer() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { preferences } = useUserPreferences();
  
  // Recipe data state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState<string[]>(['']);
  const [instructions, setInstructions] = useState<string[]>(['']);
  const [prepTime, setPrepTime] = useState(15);
  const [cookTime, setCookTime] = useState(30);
  const [estimatedCalories, setEstimatedCalories] = useState(500);
  const [portions, setPortions] = useState(2);
  const [measurementSystem, setMeasurementSystem] = useState<'metric' | 'imperial'>(
    preferences.measurementSystem || 'metric'
  );
  const [language, setLanguage] = useState<string>(
    preferences.language || 'en'
  );
  const [mealType, setMealType] = useState('dinner');
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string>('none');
  const [difficultyLevel, setDifficultyLevel] = useState('medium');
  const [cuisineType, setCuisineType] = useState('American');
  const [cookingMethod, setCookingMethod] = useState<string>('baking');
  
  // Generation options
  const [includeImage, setIncludeImage] = useState(true);
  
  // Recipe generation hook
  const { 
    generateAndSaveRecipe, 
    isGenerating, 
    isGeneratingImage 
  } = useRecipeGeneration({
    shouldGenerateImage: includeImage,
    onSuccess: (recipeId) => {
      navigate(`/recipes/${recipeId}`);
    }
  });

  // Handle saving the recipe
  const handleSaveRecipe = async () => {
    // Validate basic recipe data
    if (!title.trim()) {
      toast({
        variant: "destructive",
        title: "Missing Title",
        description: "Please provide a title for your recipe.",
      });
      return;
    }
    
    if (ingredients.filter(i => i.trim()).length === 0) {
      toast({
        variant: "destructive",
        title: "Missing Ingredients",
        description: "Please add at least one ingredient.",
      });
      return;
    }
    
    if (instructions.filter(i => i.trim()).length === 0) {
      toast({
        variant: "destructive",
        title: "Missing Instructions",
        description: "Please add at least one instruction step.",
      });
      return;
    }

    // Format categories object
    const categories = {
      meal_type: mealType,
      dietary_restrictions: dietaryRestrictions,
      difficulty_level: difficultyLevel,
      cuisine_type: cuisineType,
      cooking_method: cookingMethod,
    };
    
    // Create the recipe data object
    const recipeData = {
      title,
      description,
      ingredients: ingredients.filter(i => i.trim()),
      instructions: instructions.filter(i => i.trim()),
      prep_time: prepTime,
      cook_time: cookTime,
      estimated_calories: estimatedCalories,
      servings: portions,
      suggested_portions: portions,
      portion_description: 'servings',
      language: language as string,
      categories,
    };
    
    // Generate and save the recipe
    try {
      await generateAndSaveRecipe(recipeData);
    } catch (error) {
      console.error('Error saving recipe:', error);
    }
  };

  // Toggle measurement system
  const toggleMeasurementSystem = () => {
    setMeasurementSystem(prev => prev === 'metric' ? 'imperial' : 'metric');
  };

  // Helper function to convert language code to language name
  const getLanguageName = (code: string) => {
    return SUPPORTED_LANGUAGES[code as keyof typeof SUPPORTED_LANGUAGES] || code;
  };

  // Function to handle language selection
  const handleLanguageChange = (value: string) => {
    setLanguage(value);
  };

  const handleImageUpdate = async (imageUrl: string): Promise<void> => {
    // This is a placeholder function that returns a resolved promise
    return Promise.resolve();
  };

  // Create the simplified recipe data for the preview
  const previewRecipe = {
    id: 'preview',
    title,
    description,
    ingredients,
    instructions,
    prep_time: prepTime,
    cook_time: cookTime,
    estimated_calories: estimatedCalories,
    servings: portions,
    suggested_portions: portions,
    portion_description: 'servings',
    language,
    categories: {
      meal_type: mealType,
      dietary_restrictions: dietaryRestrictions,
      difficulty_level: difficultyLevel,
      cuisine_type: cuisineType,
      cooking_method: cookingMethod,
    },
    imageUrl: ''
  };

  return (
    <PageLayout>
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => navigate('/recipes')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Recipes
      </Button>

      <Card className="overflow-hidden rounded-lg">
        <CardContent className="p-0">
          <RecipeDisplay
            recipe={previewRecipe}
            scaledRecipe={previewRecipe}
            chosenPortions={portions}
            onPortionsChange={setPortions}
            onSave={handleSaveRecipe}
            isSaving={isGenerating}
            measurementSystem={measurementSystem}
            onMeasurementSystemChange={toggleMeasurementSystem}
            onImageUpdate={handleImageUpdate}
            onEditOrGenerate={() => console.log("Edit or generate")}
            onBack={() => navigate('/recipes')}
            isGeneratingImage={isGeneratingImage}
          />
        </CardContent>
      </Card>
    </PageLayout>
  );
}
