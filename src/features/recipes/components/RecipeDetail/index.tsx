import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Clock, Timer, Flame } from "lucide-react";
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
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] gap-4">
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

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
          <div className="md:col-span-2 lg:col-span-8">
            <Card className="overflow-hidden h-full">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">{recipe.title}</h1>
                    <p className="text-gray-600 mt-2">{recipe.description}</p>
                  </div>
                  
                  {recipe.image_url && (
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                      <img
                        src={recipe.image_url}
                        alt={recipe.title}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  )}

                  {!recipe.image_url && (
                    <ImageUploadOrGenerate
                      onImageSelected={(url) => updateRecipeImage.mutate(url)}
                      title={recipe.title}
                      disabled={isGeneratingImage}
                      toggleMode={true}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2 lg:col-span-4 flex flex-col gap-6">
            <Card>
              <CardContent className="p-6">
                <RecipeActions
                  recipeId={recipe.id}
                  isDeleting={isDeleting}
                  handleDelete={handleDelete}
                  desiredServings={desiredServings}
                  handleServingsChange={handleServingsChange}
                  measurementSystem={measurementSystem}
                  toggleMeasurementSystem={toggleMeasurementSystem}
                />
              </CardContent>
            </Card>

            <Card className="flex-1">
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
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-1 lg:col-span-6">
            <RecipeIngredients
              ingredients={recipe.ingredients}
              scaleFactor={scaleFactor}
              measurementSystem={measurementSystem}
              desiredServings={desiredServings}
              handleServingsChange={handleServingsChange}
              toggleMeasurementSystem={toggleMeasurementSystem}
              addToGroceryList={addToGroceryList}
            />
          </div>

          <div className="md:col-span-1 lg:col-span-6">
            <Card className="h-full">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">Instructions</h3>
                <ol className="list-decimal space-y-4">
                  {recipe.instructions.map((instruction, index) => (
                    <li key={index} className="text-gray-700 ml-4 pl-2">
                      <span className="block">{instruction}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 