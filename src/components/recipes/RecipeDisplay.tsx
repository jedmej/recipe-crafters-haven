import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, Tags } from "lucide-react";
import { PencilSimple, Trash, FloppyDisk, SpinnerGap, CaretLeft, Alarm, Oven, Fire, Basket, Sparkle, Link, UploadSimple, Heart } from "@phosphor-icons/react";
import { Tag } from "@/components/ui/tag";
import { ImageUploadOrGenerate } from "@/components/recipes/ImageUploadOrGenerate";
import { RecipeData } from "@/types/recipe";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import { useImageGeneration } from "@/features/recipes/hooks/useImageGeneration";
import { useFavorites } from "@/hooks/use-favorites";
import { motion, AnimatePresence } from "framer-motion";

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
  onBack: () => void;
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
  isSaving,
  onBack
}: Pick<RecipeDisplayProps, 'recipe' | 'onEditOrGenerate' | 'onSave' | 'isSaving' | 'onBack'>) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [isToggling, setIsToggling] = useState(false);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const isFavorited = recipe.id ? isFavorite(recipe.id) : false;
  
  // Debug logging
  console.log('Recipe in ActionButtons:', recipe);
  console.log('Recipe ID:', recipe.id);
  console.log('Is favorited:', isFavorited);

  // Heart animation variants
  const heartVariants = {
    initial: { scale: 1 },
    animate: { 
      scale: [1, 1.5, 1],
      transition: { 
        duration: 0.5,
        times: [0, 0.3, 1],
        ease: "easeInOut" 
      }
    }
  };

  // Pulse animation variants
  const pulseVariants = {
    initial: { 
      scale: 0.8,
      opacity: 0.7,
    },
    animate: { 
      scale: 1.8,
      opacity: 0,
      transition: { 
        duration: 0.8,
        ease: "easeOut" 
      }
    }
  };

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!recipe.id || isToggling) return; // Prevent if no recipe id or already toggling
    
    setIsToggling(true);
    setShowHeartAnimation(true);
    
    try {
      await toggleFavorite.mutateAsync(recipe.id);
    } catch (error) {
      console.error("Error toggling favorite:", error);
    } finally {
      setIsToggling(false);
      // Reset animation state after a delay
      setTimeout(() => setShowHeartAnimation(false), 1000);
    }
  };

  return (
    <>
      <button
        onClick={() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          onBack();
        }}
        className="fixed top-4 left-4 h-12 w-12 rounded-full bg-gray-100/90 backdrop-blur hover:bg-gray-200/90 flex items-center justify-center transition-colors z-50 shadow-sm"
        aria-label="Go Back"
      >
        <CaretLeft weight="duotone" className="h-5 w-5 text-gray-700" />
      </button>
      <div className="absolute top-4 right-4 flex gap-2 z-30">
        <motion.button
          onClick={handleFavoriteClick}
          disabled={!recipe.id || isToggling}
          className="relative h-12 w-12 rounded-full bg-gray-100/90 backdrop-blur hover:bg-gray-200/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={false}
        >
          <motion.div
            variants={heartVariants}
            initial="initial"
            animate={showHeartAnimation ? "animate" : "initial"}
          >
            <Heart 
              weight={isFavorited ? "duotone" : "regular"} 
              className={`h-5 w-5 ${isFavorited ? 'text-red-500' : 'text-gray-700'}`} 
            />
          </motion.div>
          
          {/* Pulse effect when favoriting */}
          <AnimatePresence>
            {showHeartAnimation && isFavorited && (
              <motion.div 
                className="absolute inset-0 rounded-full bg-red-500"
                variants={pulseVariants}
                initial="initial"
                animate="animate"
                exit={{ opacity: 0 }}
              />
            )}
          </AnimatePresence>
          
          {/* Floating hearts animation when favoriting */}
          <AnimatePresence>
            {showHeartAnimation && isFavorited && (
              <>
                {[...Array(3)].map((_, i) => (
                  <motion.div 
                    key={i}
                    className="absolute left-1/2 top-1/2 z-20"
                    initial={{ 
                      x: 0, 
                      y: 0, 
                      scale: 0.5, 
                      opacity: 0.9 
                    }}
                    animate={{ 
                      x: Math.random() * 40 - 20, 
                      y: -30 - Math.random() * 20,
                      scale: 0,
                      opacity: 0
                    }}
                    transition={{ 
                      duration: 1 + Math.random() * 0.5,
                      delay: i * 0.1,
                      ease: "easeOut" 
                    }}
                    exit={{ opacity: 0 }}
                  >
                    <Heart weight="fill" className="text-red-500 w-4 h-4" />
                  </motion.div>
                ))}
              </>
            )}
          </AnimatePresence>
        </motion.button>
        <button
          onClick={onEditOrGenerate}
          className="h-12 w-12 rounded-full bg-gray-100/90 backdrop-blur hover:bg-gray-200/90 flex items-center justify-center transition-colors"
          aria-label={recipe.id ? "Edit Recipe" : "Generate New"}
        >
          <PencilSimple weight="duotone" className="h-5 w-5 text-gray-700" />
        </button>
        <button
          onClick={onSave}
          disabled={isSaving}
          className="h-12 w-12 rounded-full bg-gray-100/90 backdrop-blur hover:bg-gray-200/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          aria-label={recipe.id ? "Delete Recipe" : "Save Recipe"}
        >
          {isSaving ? (
            <SpinnerGap className="h-5 w-5 text-gray-700 animate-spin" />
          ) : (
            recipe.id ? (
              <Trash weight="duotone" className="h-5 w-5 text-gray-700" />
            ) : (
              <FloppyDisk weight="duotone" className="h-5 w-5 text-gray-700" />
            )
          )}
        </button>
      </div>
    </>
  );
};

const TitleDescription = ({ recipe }: { recipe: RecipeData }) => (
  <Card className="overflow-hidden rounded-[48px]">
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
}) => {
  // Check if there's an image URL
  const hasImage = !!recipe.imageUrl;
  const [showImageControls, setShowImageControls] = useState(false);

  // Create refs for the file input
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const { generateImage, isLoading: isGeneratingImage } = useImageGeneration();
  const { toast } = useToast();

  const handleGenerateImage = async () => {
    try {
      const imagePrompt = `professional food photography: ${recipe.title.trim()}, appetizing presentation, elegant plating, soft natural lighting, shallow depth of field, bokeh effect, clean background, no text overlay, minimalist style, high resolution, food magazine quality, centered composition, vibrant colors, crisp details, no text, no words, no writing, no labels, no watermarks`;
      
      const imageUrl = await generateImage(imagePrompt, 'recipe');
      if (imageUrl) {
        await handleImageUpdate(imageUrl);
      }
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate image. Please try again.",
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Create a FileReader to read the file
    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageUrl = e.target?.result as string;
      if (imageUrl) {
        await handleImageUpdate(imageUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return;

    try {
      // Basic URL validation
      new URL(urlInput);
      
      // Create a new Image object to check if the URL loads successfully
      const img = new Image();
      
      img.onload = async () => {
        await handleImageUpdate(urlInput);
        setUrlInput("");
        setShowUrlInput(false);
      };
      
      img.onerror = () => {
        toast({
          variant: "destructive",
          title: "Invalid image",
          description: "The URL provided does not point to a valid image."
        });
      };
      
      img.src = urlInput;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Invalid URL",
        description: "Please enter a valid URL."
      });
    }
  };

  return (
    <div className="absolute top-0 left-0 right-0 z-10">
      {hasImage ? (
        // With image - existing implementation
        <div className="relative w-full h-[60vh]">
          <ImageUploadOrGenerate
            onImageSelected={handleImageUpdate}
            title={recipe.title}
            disabled={isSaving || isUpdatingImage}
            toggleMode={false}
            hasExistingImage={!!recipe.imageUrl}
            initialImage={recipe.imageUrl || null}
            className="w-full h-full"
            imageStyle="w-full h-full object-cover"
            hideControls={true}
          />
          <div className="absolute inset-x-0 bottom-0 h-[40vh] bg-gradient-to-b from-transparent via-white/70 to-white" />
          <div className="absolute inset-x-0 bottom-0 p-8">
            <h1 className="text-4xl sm:text-5xl font-serif font-medium text-gray-900 max-w-[800px] mx-auto">
              {recipe.title}
            </h1>
          </div>
        </div>
      ) : (
        // No image - Figma design implementation with reduced height (30vh)
        <div className="relative w-full h-[30vh] bg-[#E4E7DF] flex flex-col justify-center items-center">
          <div className="flex gap-4">
            <button 
              className="flex items-center gap-1 px-4 h-12 bg-[#F5F5F5] rounded-full text-sm"
              onClick={handleGenerateImage}
              disabled={isSaving || isUpdatingImage || isGeneratingImage}
            >
              {isGeneratingImage ? (
                <SpinnerGap className="h-5 w-5 animate-spin" />
              ) : (
                <Sparkle className="h-5 w-5" weight="duotone" />
              )}
              <span>Generate image</span>
            </button>
            
            <button 
              className="flex items-center gap-1 px-4 h-12 bg-[#F5F5F5] rounded-full text-sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSaving || isUpdatingImage}
            >
              <UploadSimple className="h-5 w-5" weight="duotone" />
              <span>Upload</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
            
            <button 
              className="flex items-center gap-1 px-4 h-12 bg-[#F5F5F5] rounded-full text-sm"
              onClick={() => setShowUrlInput(!showUrlInput)}
              disabled={isSaving || isUpdatingImage}
            >
              <Link className="h-5 w-5" weight="duotone" />
              <span>URL</span>
            </button>
          </div>
          
          {showUrlInput && (
            <div className="absolute top-[calc(50%+32px)] left-1/2 transform -translate-x-1/2 flex gap-2 w-80">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Enter image URL"
                className="flex-1 px-3 py-2 border rounded-md"
              />
              <button
                onClick={handleUrlSubmit}
                disabled={!urlInput.trim()}
                className="px-3 py-2 bg-gray-200 rounded-md"
              >
                Add
              </button>
            </div>
          )}
          
          <div className="absolute inset-x-0 bottom-0 w-full bg-gradient-to-b from-transparent to-white p-6">
            <h1 className="text-4xl sm:text-5xl font-serif font-medium text-gray-900 max-w-[800px] mx-auto">
              {recipe.title}
            </h1>
          </div>
        </div>
      )}
    </div>
  );
};

const CategoryItem = ({ icon, label, value, variant }: CategoryItemProps) => {
  // Helper function to normalize a single category value
  const normalizeValue = (val: string): string => {
    // Capitalize first letter of each word
    return val.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };
  
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
        {icon}
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {!value ? (
          <Tag variant={variant}>
            {variant === 'cooking' ? 'Other' : 'None'}
          </Tag>
        ) : Array.isArray(value) ? (
          value.length > 0 ? (
            value.map((item, index) => (
              <Tag key={index} variant={variant}>
                {normalizeValue(item)}
              </Tag>
            ))
          ) : (
            <Tag variant={variant}>
              {variant === 'cooking' ? 'Other' : 'None'}
            </Tag>
          )
        ) : (
          <Tag variant={variant}>
            {normalizeValue(value)}
          </Tag>
        )}
      </div>
    </div>
  );
};

const RecipeCategories = ({ categories }: { categories: RecipeData['categories'] }) => {
  if (!categories) return null;
  
  return (
    <div className="overflow-hidden">
      <div className="flex flex-wrap gap-4">
        {categories.meal_type && (
          <CategoryItem 
            icon={null}
            label="Meal Type"
            value={categories.meal_type}
            variant="meal"
          />
        )}
        
        {categories.difficulty_level && (
          <CategoryItem 
            icon={null}
            label="Difficulty Level"
            value={categories.difficulty_level}
            variant="difficulty"
          />
        )}
        
        {categories.cuisine_type && (
          <CategoryItem 
            icon={null}
            label="Cuisine Type"
            value={categories.cuisine_type}
            variant="cuisine"
          />
        )}
        
        {categories.cooking_method && (
          <CategoryItem 
            icon={null}
            label="Cooking Method"
            value={categories.cooking_method}
            variant="cooking"
          />
        )}
        
        {categories.occasion && (
          <CategoryItem 
            icon={null}
            label="Occasion"
            value={categories.occasion}
            variant="occasion"
          />
        )}
        
        {categories.course_category && (
          <CategoryItem 
            icon={null}
            label="Course Category"
            value={categories.course_category}
            variant="course"
          />
        )}
        
        {categories.taste_profile && (
          <CategoryItem 
            icon={null}
            label="Taste Profile"
            value={categories.taste_profile}
            variant="taste"
          />
        )}

        {categories.dietary_restrictions && (
          <CategoryItem 
            icon={null}
            label="Dietary Restrictions"
            value={categories.dietary_restrictions}
            variant="dietary"
          />
        )}
      </div>
    </div>
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
  <div className="glass-panel p-4 flex flex-col items-center text-center w-full">
    <div className="mb-2">
      {icon}
    </div>
    <div className="flex flex-col items-center">
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
  <Card className="overflow-hidden rounded-[48px] border-0 bg-[#F2F2F2]">
    <CardContent className="p-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        {scaledRecipe?.prep_time && (
          <TimeNutritionItem
            icon={<Alarm className="h-6 w-6 text-primary" weight="duotone" />}
            label="Prep Time"
            value={scaledRecipe.prep_time}
            originalValue={recipe.prep_time}
            showOriginal={chosenPortions !== recipe.suggested_portions}
            unit="mins"
          />
        )}
        
        {scaledRecipe?.cook_time && (
          <TimeNutritionItem
            icon={<Oven className="h-6 w-6 text-primary" weight="duotone" />}
            label="Cook Time"
            value={scaledRecipe.cook_time}
            originalValue={recipe.cook_time}
            showOriginal={chosenPortions !== recipe.suggested_portions}
            unit="mins"
          />
        )}
        
        {scaledRecipe?.estimated_calories && (
          <TimeNutritionItem
            icon={<Fire className="h-6 w-6 text-primary" weight="duotone" />}
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
  <Card className="overflow-hidden rounded-[48px] border-0 bg-[#E4E7DF]">
    <CardContent className="p-6">
      <div className="flex flex-col space-y-4">
        <h2 className="text-2xl font-heading">Ingredients</h2>
        <div className="flex items-center justify-start">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="1"
              value={chosenPortions}
              onChange={(e) => onPortionsChange(Number(e.target.value))}
              className="w-16"
            />
            <span className="text-sm text-muted-foreground">
              {recipe.portion_description}
              {recipe.suggested_portions && ` (Suggested: ${recipe.suggested_portions})`}
            </span>
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
              className="w-full gap-2 h-12 rounded-[500px] bg-gray-100 hover:bg-gray-200"
            >
              {isAddingToGroceryList ? (
                <SpinnerGap className="h-4 w-4 animate-spin" />
              ) : (
                <Basket className="h-4 w-4" weight="duotone" />
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
  <Card className="overflow-hidden rounded-[48px] border-0 bg-[#BFCFBC]">
    <CardContent className="p-6">
      <h2 className="text-2xl font-heading mb-2">Instructions</h2>
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
  onBack,
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

  // Check if there's an image to determine the margin-top for the main content
  const hasImage = !!recipe.imageUrl;
  const mainMarginTop = hasImage ? "mt-[55vh]" : "mt-[25vh]";

  return (
    <div className="animate-fade-in min-h-screen -mx-3 sm:-mx-6 lg:-mx-8">
      <RecipeImage 
        recipe={recipe} 
        handleImageUpdate={handleImageUpdate} 
        isSaving={isSaving} 
        isUpdatingImage={isUpdatingImage} 
      />
      <ActionButtons 
        recipe={recipe} 
        onEditOrGenerate={onEditOrGenerate} 
        onSave={onSave} 
        isSaving={isSaving}
        onBack={onBack}
      />

      <main className={`relative z-20 ${mainMarginTop} max-w-[800px] mx-auto space-y-8`}>
        {recipe.description && (
          <p className="text-lg text-gray-700 w-full">
            {recipe.description}
          </p>
        )}
        
        <RecipeCategories categories={recipe.categories} />
        
        <TimeNutrition 
          scaledRecipe={scaledRecipe} 
          recipe={recipe} 
          chosenPortions={chosenPortions} 
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
      </main>
    </div>
  );
}