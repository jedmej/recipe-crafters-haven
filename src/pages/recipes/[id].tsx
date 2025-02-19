import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Loader2, ArrowLeft, Plus, ImageIcon, Clock, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { convertMeasurement } from "@/lib/unit-conversions";
import { MeasurementSystem } from "@/lib/types";
import { RecipeHeader } from "@/components/recipes/RecipeHeader";
import { TimeAndNutrition } from "@/components/recipes/TimeAndNutrition";
import ImageGenerator from '@/components/ImageGenerator';
import { ImageUploadOrGenerate } from "@/components/recipes/ImageUploadOrGenerate";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

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
  const [measurementSystem, setMeasurementSystem] = useState<MeasurementSystem>('metric');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [showImageGenerator, setShowImageGenerator] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

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
      if (!recipe) throw new Error("Recipe not found");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const listTitle = `${recipe.title} - ${new Date().toLocaleDateString()}`;
      const scaledIngredients = (recipe.ingredients as string[]).map(ingredient => 
        scaleAndConvertIngredient(ingredient, scaleFactor, measurementSystem)
      );

      // Create the grocery list
      const { data, error } = await supabase
        .from('grocery_lists')
        .insert({
          title: listTitle,
          items: scaledIngredients.map(item => ({ name: item, checked: false })),
          user_id: user.id,
          recipe_id: recipe.id
        })
        .select('*')
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
      console.error('Error creating grocery list:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create grocery list. Please try again.",
      });
    }
  });

  const updateRecipeImage = useMutation({
    mutationFn: async (imageUrl: string) => {
      const { error } = await supabase
        .from('recipes')
        .update({ image_url: imageUrl })
        .eq('id', id);

      if (error) throw error;
      return imageUrl;
    },
    onMutate: async (newImageUrl) => {
      await queryClient.cancelQueries({ queryKey: ['recipes', id] });
      const previousRecipe = queryClient.getQueryData(['recipes', id]);
      queryClient.setQueryData(['recipes', id], (old: Recipe | undefined) => {
        if (!old) return old;
        return {
          ...old,
          image_url: newImageUrl
        };
      });
      return { previousRecipe };
    },
    onError: (err, newImageUrl, context) => {
      queryClient.setQueryData(['recipes', id], context?.previousRecipe);
      setIsRegenerating(false);
      toast({
        variant: "destructive",
        title: "Update failed",
        description: err.message,
      });
    },
    onSuccess: (imageUrl) => {
      queryClient.invalidateQueries({ queryKey: ['recipes', id] });
      setIsRegenerating(false);
      toast({
        title: "Image updated",
        description: "The recipe image has been updated successfully.",
      });
    },
  });

  const handleImageGenerated = async (imageUrl: string) => {
    try {
      await updateRecipeImage.mutateAsync(imageUrl);
    } catch (error) {
      // Error is handled by the mutation
    } finally {
      setIsGeneratingImage(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6">
        <div className="text-center py-12 border rounded-lg bg-background">
          <h1 className="text-2xl font-bold mb-2">Recipe not found</h1>
          <p className="text-muted-foreground mb-4">This recipe may have been deleted or doesn't exist.</p>
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
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate("/recipes")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Recipes
        </Button>

        <Card>
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
              onCreateGroceryList={() => {
                if (addToGroceryList.isPending) return;
                addToGroceryList.mutate();
              }}
              isDeleting={isDeleting}
            />
          </CardHeader>
        </Card>

        {/* Image Card */}
        <Card className="overflow-hidden mb-6">
          <CardContent className="p-6">
            {showImageGenerator ? (
              <ImageUploadOrGenerate
                onImageSelected={handleImageGenerated}
                title={recipe.title}
                disabled={isGeneratingImage}
                toggleMode={true}
                hasExistingImage={!!recipe.image_url}
              />
            ) : (
              <div className="space-y-4">
                {recipe.image_url ? (
                  <img
                    src={recipe.image_url}
                    alt={recipe.title}
                    className="w-full h-[400px] object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">No image available</p>
                  </div>
                )}
                <Button
                  variant="outline"
                  onClick={() => setShowImageGenerator(true)}
                  className="w-full gap-2"
                >
                  <ImageIcon className="h-4 w-4" />
                  {recipe.image_url ? 'Change Image' : 'Add Image'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Description Card */}
        {recipe.description && (
          <Card className="overflow-hidden mb-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground leading-relaxed">{recipe.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Time and Nutrition Card */}
        <Card className="overflow-hidden mb-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-2">Time & Nutrition</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recipe.prep_time && (
                <div className="glass-panel p-4 flex items-center gap-3 w-full">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium text-foreground">Prep Time</div>
                    <div className="text-sm">
                      {recipe.prep_time} mins
                      {scaleFactor !== 1 && (
                        <span className="text-xs block mt-1 text-muted-foreground">
                          (Original: {recipe.prep_time} mins)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {recipe.cook_time && (
                <div className="glass-panel p-4 flex items-center gap-3 w-full">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium text-foreground">Cook Time</div>
                    <div className="text-sm">
                      {recipe.cook_time} mins
                      {scaleFactor !== 1 && (
                        <span className="text-xs block mt-1 text-muted-foreground">
                          (Original: {recipe.cook_time} mins)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {recipe.estimated_calories && (
                <div className="glass-panel p-4 flex items-center gap-3 w-full">
                  <Flame className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium text-foreground">Calories</div>
                    <div className="text-sm">
                      {scaledCalories} total
                      {scaleFactor !== 1 && (
                        <span className="text-xs block mt-1 text-muted-foreground">
                          (Original: {recipe.estimated_calories})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recipe Content Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Ingredients Card */}
          <Card className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col space-y-4 mb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Ingredients</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        value={desiredServings}
                        onChange={(e) => handleServingsChange(e.target.value)}
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">
                        servings
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="measurement-system"
                        checked={measurementSystem === 'metric'}
                        onCheckedChange={toggleMeasurementSystem}
                      />
                      <Label htmlFor="measurement-system">
                        {measurementSystem === 'imperial' ? 'Imperial' : 'Metric'}
                      </Label>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  (Original: {recipe.servings} servings)
                </div>
              </div>
              <ul className="space-y-2 mb-4">
                {(recipe.ingredients as string[]).map((ingredient, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                    <span>
                      {scaleAndConvertIngredient(
                        ingredient,
                        scaleFactor,
                        measurementSystem
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Instructions Card */}
          <Card className="overflow-hidden">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-2">Instructions</h3>
              <ol className="space-y-4">
                {(recipe.instructions as string[]).map((instruction, index) => (
                  <li key={index} className="flex gap-4">
                    <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-medium">
                      {index + 1}
                    </span>
                    <span className="mt-1">{instruction}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>

        {/* Decorative sphere accents */}
        <div className="sphere-accent opacity-10 top-[20%] left-[-150px]" />
        <div className="sphere-accent opacity-10 bottom-[10%] right-[-150px]" />
      </div>
    </div>
  );
}
