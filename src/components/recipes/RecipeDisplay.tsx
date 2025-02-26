import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Clock, Flame, Loader2, Plus, Tags, RefreshCw, Trash2, Save, Edit, Wand2 } from "lucide-react";
import { Tag } from "@/components/ui/tag";
import { ImageUploadOrGenerate } from "@/components/recipes/ImageUploadOrGenerate";
import { RecipeData } from "@/types/recipe";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface RecipeDisplayProps {
  recipe: RecipeData;
  scaledRecipe: RecipeData;
  chosenPortions: number;
  onPortionsChange: (portions: number) => void;
  onSave: () => void;
  isSaving: boolean;
  measurementSystem: 'metric' | 'imperial';
  onMeasurementSystemChange: () => void;
  onImageUpdate?: (imageUrl: string) => void;
  onAddToGroceryList?: () => void;
  isAddingToGroceryList?: boolean;
  onEditOrGenerate: () => void;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

export function RecipeDisplay({
  recipe,
  scaledRecipe,
  chosenPortions,
  onPortionsChange,
  onSave,
  isSaving,
  measurementSystem,
  onMeasurementSystemChange,
  onImageUpdate,
  onAddToGroceryList,
  isAddingToGroceryList,
  onEditOrGenerate,
  onRegenerate,
  isRegenerating,
}: RecipeDisplayProps) {
  const { toast } = useToast();
  const [isUpdatingImage, setIsUpdatingImage] = useState(false);

  const handleImageUpdate = async (imageUrl: string) => {
    if (!onImageUpdate) return;
    
    try {
      setIsUpdatingImage(true);
      
      // Show a loading toast
      toast({
        title: "Saving image...",
        description: "Please wait while we save your changes.",
      });

      // Call the mutation and wait for it to complete
      await onImageUpdate(imageUrl);
      
      // Show success toast
      toast({
        title: "Success",
        description: "Recipe image has been updated.",
      });
    } catch (error) {
      console.error('Error updating image:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update the recipe image. Please try again.",
      });
      throw error;
    } finally {
      setIsUpdatingImage(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Action Buttons Container */}
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex justify-end gap-4">
            <Button 
              onClick={onEditOrGenerate}
              variant="outline"
              className="gap-2"
            >
              {recipe.id ? (
                <>
                  <Edit className="h-4 w-4" />
                  Edit Recipe
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  Generate New
                </>
              )}
            </Button>
            <Button 
              onClick={onSave}
              variant={recipe.id ? "destructive" : "outline"}
              className="gap-2"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {recipe.id ? 'Deleting Recipe...' : 'Saving Recipe...'}
                </>
              ) : (
                <>
                  {recipe.id ? (
                    <Trash2 className="h-4 w-4" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {recipe.id ? 'Delete Recipe' : 'Save Recipe'}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Title and Description */}
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-4">{recipe.title}</h1>
              {recipe.description && (
                <p className="text-muted-foreground leading-relaxed">{recipe.description}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recipe Image Section */}
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recipe Image</h3>
          {!recipe.imageUrl ? (
            <div className="w-full max-w-2xl mx-auto p-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
              <ImageUploadOrGenerate
                onImageSelected={handleImageUpdate}
                title={recipe.title}
                disabled={isSaving || isUpdatingImage}
                toggleMode={false}
                hasExistingImage={false}
                initialImage={null}
              />
            </div>
          ) : (
            <div className="w-full max-w-3xl mx-auto">
              <ImageUploadOrGenerate
                onImageSelected={handleImageUpdate}
                title={recipe.title}
                disabled={isSaving || isUpdatingImage}
                toggleMode={false}
                hasExistingImage={true}
                initialImage={recipe.imageUrl}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recipe Tags */}
      {recipe.categories && (
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recipe.categories.meal_type && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <Tags className="h-4 w-4" />
                    Meal Type
                  </label>
                  <Tag variant="meal">{recipe.categories.meal_type}</Tag>
                </div>
              )}
              
              {recipe.categories.dietary_restrictions && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <Tags className="h-4 w-4" />
                    Dietary Restrictions
                  </label>
                  <Tag variant="dietary">
                    {Array.isArray(recipe.categories.dietary_restrictions) 
                      ? recipe.categories.dietary_restrictions.join(', ') 
                      : recipe.categories.dietary_restrictions[0] || 'None'}
                  </Tag>
                </div>
              )}
              
              {recipe.categories.difficulty_level && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <Tags className="h-4 w-4" />
                    Difficulty Level
                  </label>
                  <Tag variant="difficulty">{recipe.categories.difficulty_level}</Tag>
                </div>
              )}
              
              {recipe.categories.cuisine_type && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <Tags className="h-4 w-4" />
                    Cuisine Type
                  </label>
                  <Tag variant="cuisine">{recipe.categories.cuisine_type}</Tag>
                </div>
              )}
              
              {recipe.categories.cooking_method && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <Tags className="h-4 w-4" />
                    Cooking Method
                  </label>
                  <Tag variant="cooking">
                    {Array.isArray(recipe.categories.cooking_method) 
                      ? recipe.categories.cooking_method.join(', ') 
                      : recipe.categories.cooking_method[0] || 'Other'}
                  </Tag>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Time and Nutrition Card */}
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-2">Time & Nutrition</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {scaledRecipe?.prep_time && (
              <div className="glass-panel p-4 flex items-center gap-3 w-full">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-medium text-foreground">Prep Time</div>
                  <div className="text-sm">
                    {scaledRecipe.prep_time} mins
                    {chosenPortions !== recipe.suggested_portions && (
                      <span className="text-xs block mt-1 text-muted-foreground">
                        (Original: {recipe.prep_time} mins)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {scaledRecipe?.cook_time && (
              <div className="glass-panel p-4 flex items-center gap-3 w-full">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-medium text-foreground">Cook Time</div>
                  <div className="text-sm">
                    {scaledRecipe.cook_time} mins
                    {chosenPortions !== recipe.suggested_portions && (
                      <span className="text-xs block mt-1 text-muted-foreground">
                        (Original: {recipe.cook_time} mins)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {scaledRecipe?.estimated_calories && (
              <div className="glass-panel p-4 flex items-center gap-3 w-full">
                <Flame className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-medium text-foreground">Calories</div>
                  <div className="text-sm">
                    {scaledRecipe.estimated_calories} total
                    {chosenPortions !== recipe.suggested_portions && (
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Ingredients Card */}
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Ingredients</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="1"
                      value={chosenPortions}
                      onChange={(e) => onPortionsChange(Number(e.target.value))}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">
                      {recipe.portion_description}
                      {recipe.suggested_portions && (
                        <span className="ml-1">(Suggested: {recipe.suggested_portions} {recipe.portion_description})</span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="measurement-system"
                      checked={measurementSystem === 'metric'}
                      onCheckedChange={onMeasurementSystemChange}
                    />
                    <Label htmlFor="measurement-system">
                      {measurementSystem === 'imperial' ? 'Imperial' : 'Metric'}
                    </Label>
                  </div>
                </div>
              </div>
              <ul className="space-y-2">
                {scaledRecipe.ingredients.map((ingredient, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                    <span>{ingredient}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-4">
                {onAddToGroceryList && (
                  <Button
                    variant="outline"
                    onClick={onAddToGroceryList}
                    disabled={isAddingToGroceryList}
                    className="w-full gap-2"
                  >
                    {isAddingToGroceryList ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    Add to Grocery List
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions Card */}
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-2">Instructions</h3>
            <ol className="space-y-4">
              {scaledRecipe.instructions.map((instruction, index) => (
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
  );
}