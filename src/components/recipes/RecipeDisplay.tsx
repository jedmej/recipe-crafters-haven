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

interface CategoryItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | string[];
  variant: string;
}

interface TimeNutritionItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  originalValue?: string | number;
  showOriginal: boolean;
  unit?: string;
}

const ActionButtons = ({ 
  recipe, 
  onEditOrGenerate, 
  onSave, 
  isSaving 
}: Pick<RecipeDisplayProps, 'recipe' | 'onEditOrGenerate' | 'onSave' | 'isSaving'>) => (
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
);

const TitleDescription = ({ recipe }: { recipe: RecipeData }) => (
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
);

const RecipeImage = ({ 
  recipe, 
  handleImageUpdate, 
  isSaving, 
  isUpdatingImage 
}: { 
  recipe: RecipeData; 
  handleImageUpdate: (imageUrl: string) => Promise<void>; 
  isSaving: boolean; 
  isUpdatingImage: boolean;
}) => (
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
);

const CategoryItem = ({ icon, label, value, variant }: CategoryItemProps) => (
  <div className="space-y-2">
    <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
      {icon}
      {label}
    </label>
    <Tag variant={variant}>
      {Array.isArray(value) 
        ? value.join(', ') 
        : value || (variant === 'cooking' ? 'Other' : 'None')}
    </Tag>
  </div>
);

const RecipeCategories = ({ categories }: { categories: RecipeData['categories'] }) => {
  if (!categories) return null;
  
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.meal_type && (
            <CategoryItem 
              icon={<Tags className="h-4 w-4" />}
              label="Meal Type"
              value={categories.meal_type}
              variant="meal"
            />
          )}
          
          {categories.dietary_restrictions && (
            <CategoryItem 
              icon={<Tags className="h-4 w-4" />}
              label="Dietary Restrictions"
              value={categories.dietary_restrictions}
              variant="dietary"
            />
          )}
          
          {categories.difficulty_level && (
            <CategoryItem 
              icon={<Tags className="h-4 w-4" />}
              label="Difficulty Level"
              value={categories.difficulty_level}
              variant="difficulty"
            />
          )}
          
          {categories.cuisine_type && (
            <CategoryItem 
              icon={<Tags className="h-4 w-4" />}
              label="Cuisine Type"
              value={categories.cuisine_type}
              variant="cuisine"
            />
          )}
          
          {categories.cooking_method && (
            <CategoryItem 
              icon={<Tags className="h-4 w-4" />}
              label="Cooking Method"
              value={categories.cooking_method}
              variant="cooking"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const TimeNutritionItem = ({ 
  icon, 
  label, 
  value, 
  originalValue, 
  showOriginal,
  unit = ''
}: TimeNutritionItemProps) => (
  <div className="glass-panel p-4 flex items-center gap-3 w-full">
    {icon}
    <div>
      <div className="font-medium text-foreground">{label}</div>
      <div className="text-sm">
        {value} {unit}
        {showOriginal && originalValue && (
          <span className="text-xs block mt-1 text-muted-foreground">
            (Original: {originalValue} {unit})
          </span>
        )}
      </div>
    </div>
  </div>
);

const TimeNutrition = ({ 
  scaledRecipe, 
  recipe, 
  chosenPortions 
}: { 
  scaledRecipe: RecipeData; 
  recipe: RecipeData; 
  chosenPortions: number;
}) => (
  <Card className="overflow-hidden">
    <CardContent className="p-6">
      <h3 className="text-lg font-semibold mb-2">Time & Nutrition</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {scaledRecipe?.prep_time && (
          <TimeNutritionItem
            icon={<Clock className="h-5 w-5 text-primary" />}
            label="Prep Time"
            value={scaledRecipe.prep_time}
            originalValue={recipe.prep_time}
            showOriginal={chosenPortions !== recipe.suggested_portions}
            unit="mins"
          />
        )}
        
        {scaledRecipe?.cook_time && (
          <TimeNutritionItem
            icon={<Clock className="h-5 w-5 text-primary" />}
            label="Cook Time"
            value={scaledRecipe.cook_time}
            originalValue={recipe.cook_time}
            showOriginal={chosenPortions !== recipe.suggested_portions}
            unit="mins"
          />
        )}
        
        {scaledRecipe?.estimated_calories && (
          <TimeNutritionItem
            icon={<Flame className="h-5 w-5 text-primary" />}
            label="Calories"
            value={scaledRecipe.estimated_calories}
            originalValue={recipe.estimated_calories}
            showOriginal={chosenPortions !== recipe.suggested_portions}
            unit="total"
          />
        )}
      </div>
    </CardContent>
  </Card>
);

const IngredientsSection = ({ 
  scaledRecipe, 
  recipe, 
  chosenPortions, 
  onPortionsChange, 
  measurementSystem, 
  onMeasurementSystemChange,
  onAddToGroceryList,
  isAddingToGroceryList
}: Pick<RecipeDisplayProps, 
  'scaledRecipe' | 
  'recipe' | 
  'chosenPortions' | 
  'onPortionsChange' | 
  'measurementSystem' | 
  'onMeasurementSystemChange' | 
  'onAddToGroceryList' | 
  'isAddingToGroceryList'
>) => (
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
);

const InstructionsSection = ({ instructions }: { instructions: string[] }) => (
  <Card className="overflow-hidden">
    <CardContent className="p-6">
      <h3 className="text-lg font-semibold mb-2">Instructions</h3>
      <ol className="space-y-4">
        {instructions.map((instruction, index) => (
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
);

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
      
      toast({
        title: "Saving image...",
        description: "Please wait while we save your changes.",
      });

      await onImageUpdate(imageUrl);
      
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
      <ActionButtons 
        recipe={recipe} 
        onEditOrGenerate={onEditOrGenerate} 
        onSave={onSave} 
        isSaving={isSaving} 
      />
      
      <TitleDescription recipe={recipe} />
      
      <RecipeImage 
        recipe={recipe} 
        handleImageUpdate={handleImageUpdate} 
        isSaving={isSaving} 
        isUpdatingImage={isUpdatingImage} 
      />
      
      <RecipeCategories categories={recipe.categories} />
      
      <TimeNutrition 
        scaledRecipe={scaledRecipe} 
        recipe={recipe} 
        chosenPortions={chosenPortions} 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <IngredientsSection 
          scaledRecipe={scaledRecipe}
          recipe={recipe}
          chosenPortions={chosenPortions}
          onPortionsChange={onPortionsChange}
          measurementSystem={measurementSystem}
          onMeasurementSystemChange={onMeasurementSystemChange}
          onAddToGroceryList={onAddToGroceryList}
          isAddingToGroceryList={isAddingToGroceryList}
        />
        
        <InstructionsSection instructions={scaledRecipe.instructions} />
      </div>

      {/* Decorative sphere accents */}
      <div className="sphere-accent opacity-10 top-[20%] left-[-150px]" />
      <div className="sphere-accent opacity-10 bottom-[10%] right-[-150px]" />
    </div>
  );
}