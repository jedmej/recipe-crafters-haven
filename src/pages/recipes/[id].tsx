import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { useRecipeDetail } from '@/features/recipes/hooks/useRecipeDetail';
import { useRecipeActions } from '@/features/recipes/hooks/useRecipeActions';
import { RecipeDisplay } from '@/components/recipes/RecipeDisplay';
import { Loader2 } from 'lucide-react';

// Special routes that should not be treated as recipe IDs
const SPECIAL_ROUTES = ['inspire', 'ai-search', 'import-ai', 'import', 'edit', 'new', 'generate-image'];

// Regular expression to match ingredient quantities with units
const INGREDIENT_REGEX = /^((?:\d*\.)?\d+(?:\/\d+)?)\s*([a-zA-Z]*)\s+(.+)$/;

// Function to scale a fraction or decimal number
function scaleNumber(value: string, scale: number): number {
  if (value.includes('/')) {
    const [numerator, denominator] = value.split('/');
    return (parseFloat(numerator) / parseFloat(denominator)) * scale;
  }
  return parseFloat(value) * scale;
}

// Function to format a number nicely for display
function formatNumber(num: number): string {
  if (num === Math.floor(num)) {
    return num.toString();
  }
  // Convert to fraction if close to common fractions
  const tolerance = 0.01;
  const fractions = [
    { decimal: 0.25, fraction: '1/4' },
    { decimal: 0.33, fraction: '1/3' },
    { decimal: 0.5, fraction: '1/2' },
    { decimal: 0.67, fraction: '2/3' },
    { decimal: 0.75, fraction: '3/4' }
  ];
  
  for (const { decimal, fraction } of fractions) {
    if (Math.abs(num - decimal) < tolerance) {
      return fraction;
    }
  }
  
  return num.toFixed(2).replace(/\.?0+$/, '');
}

// Function to scale an ingredient
function scaleIngredient(ingredient: string, scaleFactor: number): string {
  const match = ingredient.match(INGREDIENT_REGEX);
  if (!match) return ingredient; // Return original if no quantity found
  
  const [, quantity, unit, rest] = match;
  const scaledQuantity = scaleNumber(quantity, scaleFactor);
  const formattedQuantity = formatNumber(scaledQuantity);
  
  return `${formattedQuantity}${unit ? ` ${unit}` : ''} ${rest}`;
}

export default function RecipeDetailRoute() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // If it's a special route, don't try to load a recipe
  if (id && SPECIAL_ROUTES.includes(id)) {
    return null; // Let the normal routing handle these special routes
  }
  
  // Check if the ID is a valid UUID or numeric ID
  const isValidId = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$|^\d+$/.test(id || '');
  
  if (!isValidId) {
    return <Navigate to="/recipes" replace />;
  }

  const {
    recipe,
    isLoading,
    error,
    desiredServings,
    measurementSystem,
    scaleFactor,
    handleServingsChange,
    toggleMeasurementSystem,
  } = useRecipeDetail(id);

  const {
    isDeleting,
    handleDelete,
    addToGroceryList,
    updateRecipeImage,
  } = useRecipeActions(recipe, scaleFactor, measurementSystem);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] gap-4">
        <p className="text-lg text-red-500">Error loading recipe</p>
      </div>
    );
  }

  // Scale the recipe based on desired servings
  const scaledRecipe = {
    ...recipe,
    prep_time: Math.round(recipe.prep_time * scaleFactor),
    cook_time: Math.round(recipe.cook_time * scaleFactor),
    estimated_calories: Math.round(recipe.estimated_calories * scaleFactor),
    ingredients: recipe.ingredients.map(ingredient => scaleIngredient(ingredient, scaleFactor)),
    instructions: recipe.instructions,
    // Ensure imageUrl is properly mapped from image_url if needed
    imageUrl: recipe.imageUrl || recipe.image_url,
  };

  return (
    <div className="container mx-auto py-8">
      <RecipeDisplay
        recipe={{
          ...recipe,
          imageUrl: recipe.imageUrl || recipe.image_url,
        }}
        scaledRecipe={scaledRecipe}
        chosenPortions={desiredServings}
        onPortionsChange={handleServingsChange}
        onSave={handleDelete}
        isSaving={isDeleting}
        measurementSystem={measurementSystem}
        onMeasurementSystemChange={toggleMeasurementSystem}
        onImageUpdate={(imageUrl) => updateRecipeImage.mutateAsync(imageUrl)}
        onAddToGroceryList={() => addToGroceryList.mutate()}
        isAddingToGroceryList={addToGroceryList.isPending}
        onEditOrGenerate={() => {
          if (recipe.id) {
            navigate(`/recipes/${recipe.id}/edit`);
          } else {
            navigate('/recipes/inspire', { 
              state: { 
                title: recipe.title,
                description: recipe.description,
                ingredients: recipe.ingredients,
                instructions: recipe.instructions,
                categories: recipe.categories
              }
            });
          }
        }}
      />
    </div>
  );
}
