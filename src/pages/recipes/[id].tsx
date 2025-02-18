import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { convertMeasurement } from "@/lib/unit-conversions";
import { MeasurementSystem } from "@/lib/types";
import { RecipeHeader } from "@/components/recipes/RecipeHeader";
import { TimeAndNutrition } from "@/components/recipes/TimeAndNutrition";

type Recipe = Database['public']['Tables']['recipes']['Row'];

function parseQuantity(ingredient: string): { quantity: number | null; unit: string; item: string } {
  const regex = /^((?:\d+\s+)?(?:\d+\/\d+|\d*\.?\d+))?\s*([a-zA-Z]*)\s*(.*)/;
  const match = ingredient.match(regex);

  if (!match) {
    return { quantity: null, unit: "", item: ingredient.trim() };
  }

  const [, quantityStr, unit, item] = match;
  let quantity: number | null = null;

  if (quantityStr) {
    if (quantityStr.includes("/")) {
      const [num, denom] = quantityStr.split("/").map(Number);
      quantity = num / denom;
    } else {
      quantity = parseFloat(quantityStr);
    }
  }

  return {
    quantity,
    unit: unit.toLowerCase(),
    item: item.trim()
  };
}

function formatQuantity(quantity: number): string {
  const fractions: [number, string][] = [
    [1/8, "⅛"], [1/4, "¼"], [1/3, "⅓"], [1/2, "½"],
    [2/3, "⅔"], [3/4, "¾"]
  ];

  const rounded = Math.round(quantity * 100) / 100;

  for (const [fraction, symbol] of fractions) {
    if (Math.abs(rounded - fraction) < 0.05) {
      return symbol;
    }
  }

  if (Math.round(rounded) === rounded) {
    return rounded.toString();
  }

  return rounded.toFixed(2).replace(/\.?0+$/, '');
}

function scaleIngredient(ingredient: string, scaleFactor: number): string {
  const { quantity, unit, item } = parseQuantity(ingredient);
  
  if (quantity === null) {
    return ingredient;
  }

  const scaledQuantity = quantity * scaleFactor;
  const formattedQuantity = formatQuantity(scaledQuantity);
  
  return `${formattedQuantity}${unit ? ' ' + unit : ''} ${item}`;
}

function convertIngredient(ingredient: string, targetSystem: MeasurementSystem): string {
  const { quantity, unit, item } = parseQuantity(ingredient);
  
  if (!quantity || !unit) {
    return ingredient;
  }

  const converted = convertMeasurement(quantity, unit, targetSystem);
  if (!converted) {
    return ingredient;
  }

  return `${formatQuantity(converted.quantity)} ${converted.unit} ${item}`;
}

function scaleAndConvertIngredient(
  ingredient: string, 
  scaleFactor: number, 
  targetSystem: MeasurementSystem
): string {
  const scaled = scaleIngredient(ingredient, scaleFactor);
  return convertIngredient(scaled, targetSystem);
}

export default function RecipeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);
  const [desiredServings, setDesiredServings] = useState<number | ''>(1);
  const [measurementSystem, setMeasurementSystem] = useState<MeasurementSystem>('imperial');

  const { data: recipe, isLoading, error } = useQuery({
    queryKey: ['recipes', id],
    queryFn: async () => {
      if (!id) throw new Error('Recipe ID is required');
      
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) throw new Error('Recipe not found');
      
      return data as Recipe;
    },
    enabled: !!id
  });

  const deleteRecipe = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      navigate('/recipes');
      toast({
        title: "Recipe deleted",
        description: "Your recipe has been successfully deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  });

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this recipe?')) {
      setIsDeleting(true);
      await deleteRecipe.mutateAsync();
      setIsDeleting(false);
    }
  };

  const handleServingsChange = (value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue > 0) {
      setDesiredServings(numValue);
    } else if (value === '') {
      setDesiredServings('');
    }
  };

  const toggleMeasurementSystem = () => {
    setMeasurementSystem(prev => prev === 'imperial' ? 'metric' : 'imperial');
  };

  const scaleFactor = typeof desiredServings === 'number' && recipe 
    ? desiredServings / recipe.servings 
    : 1;

  const calculateCaloriesPerServing = (totalCalories: number | null, servings: number): number | null => {
    if (totalCalories === null) return null;
    return Math.round(totalCalories / servings);
  };

  const addToGroceryList = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const listTitle = `${recipe.title} - ${new Date().toLocaleDateString()}`;
      const scaledIngredients = (recipe.ingredients as string[]).map(ingredient => 
        scaleAndConvertIngredient(ingredient, scaleFactor, measurementSystem)
      );

      const { data, error } = await supabase
        .from('grocery_lists')
        .insert([
          {
            title: listTitle,
            items: scaledIngredients,
            user_id: user.id,
          }
        ])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      navigate(`/grocery-lists/${data.id}`);
      toast({
        title: "Grocery list created",
        description: "Recipe ingredients have been added to a new grocery list.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex flex-col items-center justify-center gap-4">
          <h1 className="text-2xl font-bold text-red-600">Error Loading Recipe</h1>
          <p className="text-gray-600">{error.message}</p>
          <Button onClick={() => navigate("/recipes")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Recipes
          </Button>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex flex-col items-center justify-center gap-4">
          <h1 className="text-2xl font-bold">Recipe Not Found</h1>
          <p className="text-gray-600">The recipe you're looking for doesn't exist or has been deleted.</p>
          <Button onClick={() => navigate("/recipes")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Recipes
          </Button>
        </div>
      </div>
    );
  }

  const caloriesPerServing = recipe.estimated_calories 
    ? calculateCaloriesPerServing(recipe.estimated_calories, recipe.servings)
    : null;

  const scaledCalories = recipe.estimated_calories 
    ? Math.round(recipe.estimated_calories * scaleFactor)
    : null;

  const scaledCaloriesPerServing = scaledCalories 
    ? calculateCaloriesPerServing(scaledCalories, desiredServings as number)
    : null;

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/recipes")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Recipes
        </Button>
        <Button
          onClick={() => addToGroceryList.mutate()}
          disabled={addToGroceryList.isPending}
        >
          {addToGroceryList.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding to List...
            </>
          ) : (
            'Add to Grocery List'
          )}
        </Button>
      </div>

      <Card>
        {recipe.image_url && (
          <div className="relative h-64 w-full">
            <img
              src={recipe.image_url}
              alt={recipe.title}
              className="absolute inset-0 w-full h-full object-cover rounded-t-lg"
            />
          </div>
        )}
        
        <CardHeader>
          <RecipeHeader
            title={recipe.title}
            originalServings={recipe.servings}
            desiredServings={desiredServings}
            measurementSystem={measurementSystem}
            onServingsChange={handleServingsChange}
            onMeasurementSystemChange={toggleMeasurementSystem}
            onEdit={() => navigate(`/recipes/${id}/edit`)}
            onDelete={handleDelete}
            isDeleting={isDeleting}
          />
        </CardHeader>

        <CardContent className="space-y-6">
          {recipe.description && (
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground">{recipe.description}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TimeAndNutrition
              prepTime={recipe.prep_time}
              cookTime={recipe.cook_time}
              estimatedCalories={recipe.estimated_calories}
              scaledCalories={scaledCalories}
              caloriesPerServing={caloriesPerServing}
              scaledCaloriesPerServing={scaledCaloriesPerServing}
              showOriginalCalories={scaleFactor !== 1}
            />
          </div>

          <div>
            <h3 className="font-semibold mb-2">Ingredients</h3>
            <ul className="list-disc pl-5 space-y-1">
              {(recipe.ingredients as string[]).map((ingredient, index) => (
                <li key={index}>
                  {scaleAndConvertIngredient(ingredient, scaleFactor, measurementSystem)}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Instructions</h3>
            <ol className="list-decimal pl-5 space-y-2">
              {(recipe.instructions as string[]).map((instruction, index) => (
                <li key={index}>{instruction}</li>
              ))}
            </ol>
          </div>

          {recipe.source_url && (
            <div>
              <h3 className="font-semibold mb-2">Source</h3>
              <a
                href={recipe.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Original Recipe
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
