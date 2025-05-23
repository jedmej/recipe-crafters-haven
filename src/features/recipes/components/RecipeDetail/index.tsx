
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Clock, Timer, Flame, ListPlus, Tags } from "lucide-react";
import { ImageUploadOrGenerate } from "@/components/recipes/ImageUploadOrGenerate";
import { RecipeIngredients } from './RecipeIngredients';
import { RecipeActions } from './RecipeActions';
import { useRecipeDetail } from '../../hooks/useRecipeDetail';
import { useRecipeActions } from '../../hooks/useRecipeActions';

export default function RecipeDetailPage() {
  const { id } = useParams();
  const {
    recipe,
    isLoading,
    error,
    desiredServings,
    measurementSystem,
    isGeneratingImage,
    showImageGenerator,
    isRegenerating,
    scaleFactor,
    handleServingsChange,
    toggleMeasurementSystem,
    calculateCaloriesPerServing,
    setIsGeneratingImage,
    setShowImageGenerator,
    setIsRegenerating
  } = useRecipeDetail(id);

  const {
    isDeleting,
    handleDelete,
    addToGroceryList,
    updateRecipeImage
  } = useRecipeActions(recipe, scaleFactor, measurementSystem);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-4">
        <p className="text-lg text-red-500">Error loading recipe</p>
        <Button asChild>
          <Link to="/recipes">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Recipes
          </Link>
        </Button>
      </div>
    );
  }

  // Ensure categories is an object and extract values safely
  const categories = typeof recipe.categories === 'object' && recipe.categories !== null 
    ? recipe.categories 
    : {};

  const getMealType = () => {
    if (!categories) return 'Other';
    return typeof categories === 'object' && 'meal_type' in categories 
      ? categories.meal_type 
      : 'Other';
  };

  const getDietaryRestrictions = () => {
    if (!categories) return 'None';
    return typeof categories === 'object' && 'dietary_restrictions' in categories 
      ? categories.dietary_restrictions 
      : 'None';
  };

  const getDifficultyLevel = () => {
    if (!categories) return 'Medium';
    return typeof categories === 'object' && 'difficulty_level' in categories 
      ? categories.difficulty_level 
      : 'Medium';
  };

  const getCuisineType = () => {
    if (!categories) return 'Other';
    return typeof categories === 'object' && 'cuisine_type' in categories 
      ? categories.cuisine_type 
      : 'Other';
  };

  const getCookingMethod = () => {
    if (!categories) return 'Other';
    return typeof categories === 'object' && 'cooking_method' in categories 
      ? categories.cooking_method 
      : 'Other';
  };

  // Ensure ingredients and instructions are arrays
  const safeIngredients = Array.isArray(recipe.ingredients) 
    ? recipe.ingredients.map(item => typeof item === 'string' ? item : String(item))
    : [];

  const safeInstructions = Array.isArray(recipe.instructions)
    ? recipe.instructions.map(item => typeof item === 'string' ? item : String(item))
    : [];

  return (
    <div className="bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <Button
          variant="ghost"
          className="mb-8"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          <div className="lg:col-span-8">
            <Card className="overflow-hidden">
              <CardContent className="p-6 lg:p-8">
                <div className="space-y-6">
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">{recipe.title}</h1>
                    <p className="text-gray-600 mt-4 text-lg">{recipe.description}</p>
                    
                    {categories && (
                      <div className="space-y-4 mt-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                              <Tags className="h-4 w-4" />
                              Meal Type
                            </label>
                            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                              {getMealType()}
                            </span>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                              <Tags className="h-4 w-4" />
                              Dietary Restrictions
                            </label>
                            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                              {getDietaryRestrictions()}
                            </span>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                              <Tags className="h-4 w-4" />
                              Difficulty Level
                            </label>
                            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                              {getDifficultyLevel()}
                            </span>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                              <Tags className="h-4 w-4" />
                              Cuisine Type
                            </label>
                            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                              {getCuisineType()}
                            </span>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                              <Tags className="h-4 w-4" />
                              Cooking Method
                            </label>
                            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                              {getCookingMethod()}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {recipe.image_url && (
                    <div className="relative w-full h-[500px] rounded-xl overflow-hidden">
                      <img
                        src={recipe.image_url}
                        alt={recipe.title}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  )}

                  {!recipe.image_url && (
                    <div className="h-[200px] flex items-center justify-center rounded-xl overflow-hidden bg-gray-50">
                      <ImageUploadOrGenerate
                        onImageSelected={(url) => updateRecipeImage.mutate(url)}
                        title={recipe.title}
                        disabled={isGeneratingImage}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-6">
            <Card>
              <CardContent className="p-6">
                <RecipeActions
                  recipeId={recipe.id}
                  isDeleting={isDeleting}
                  handleDelete={handleDelete}
                  measurementSystem={measurementSystem}
                  toggleMeasurementSystem={toggleMeasurementSystem}
                  recipe={{
                    title: recipe.title,
                    description: recipe.description,
                    ingredients: safeIngredients,
                    instructions: safeInstructions,
                    categories: categories
                  }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-3 lg:grid-cols-1 gap-4">
                  <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
                    <Clock className="h-6 w-6 text-gray-500 mb-2" />
                    <p className="text-sm text-gray-500">Prep Time</p>
                    <p className="text-lg font-semibold">{recipe.prep_time} min</p>
                  </div>
                  <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
                    <Timer className="h-6 w-6 text-gray-500 mb-2" />
                    <p className="text-sm text-gray-500">Cook Time</p>
                    <p className="text-lg font-semibold">{recipe.cook_time} min</p>
                  </div>
                  <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
                    <Flame className="h-6 w-6 text-gray-500 mb-2" />
                    <p className="text-sm text-gray-500">Calories</p>
                    <p className="text-lg font-semibold">
                      {Math.round(calculateCaloriesPerServing(recipe.estimated_calories, recipe.servings) * scaleFactor)} kcal
                    </p>
                  </div>
                  <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Servings</p>
                    <p className="text-lg font-semibold">
                      {recipe.servings} {recipe.portion_description}
                    </p>
                    {recipe.suggested_portions !== recipe.servings && (
                      <p className="text-sm text-muted-foreground mt-1">
                        (Suggested: {recipe.suggested_portions})
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-6">
            <Card>
              <CardContent className="p-6 lg:p-8">
                <h3 className="text-2xl font-semibold mb-6">Ingredients</h3>
                <RecipeIngredients
                  ingredients={safeIngredients}
                  scaleFactor={scaleFactor}
                  measurementSystem={measurementSystem}
                  desiredServings={desiredServings}
                  handleServingsChange={handleServingsChange}
                  toggleMeasurementSystem={toggleMeasurementSystem}
                  addToGroceryList={addToGroceryList}
                  recipe={recipe}
                />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-6">
            <Card>
              <CardContent className="p-6 lg:p-8">
                <h3 className="text-2xl font-semibold mb-6">Instructions</h3>
                <div className="space-y-4">
                  {safeInstructions.map((instruction, index) => (
                    <div key={index} className="flex items-start gap-4 text-lg text-gray-700">
                      <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-700 font-medium">
                        {index + 1}
                      </span>
                      <span>{instruction}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
