import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Edit, Trash, Tags } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MeasurementSystem } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface RecipeActionsProps {
  recipeId: string;
  isDeleting: boolean;
  handleDelete: () => Promise<void>;
  measurementSystem: MeasurementSystem;
  toggleMeasurementSystem: () => void;
  recipe: {
    title: string;
    description: string;
    ingredients: string[];
    instructions: string[];
    categories: {
      meal_type: string;
      dietary_restrictions: string;
      difficulty_level: string;
      cuisine_type: string;
      cooking_method: string;
    };
  };
}

export function RecipeActions({
  recipeId,
  isDeleting,
  handleDelete,
  measurementSystem,
  toggleMeasurementSystem,
  recipe
}: RecipeActionsProps) {
  const { toast } = useToast();
  const [isGeneratingCategories, setIsGeneratingCategories] = React.useState(false);

  const generateCategories = async () => {
    setIsGeneratingCategories(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("User not authenticated");

      // Get the Supabase project URL and anon key
      const supabaseUrl = supabase.supabaseUrl;
      const supabaseKey = supabase.supabaseKey;

      const response = await fetch(`${supabaseUrl}/functions/v1/recipe-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          query: `Analyze this existing recipe and suggest appropriate categories. Title: ${recipe.title}, Description: ${recipe.description}, Ingredients: ${recipe.ingredients.join(', ')}, Instructions: ${recipe.instructions.join(', ')}`,
          language: 'en',
          // Include dummy values for required fields
          recipeData: {
            title: recipe.title,
            description: recipe.description,
            ingredients: recipe.ingredients,
            instructions: recipe.instructions,
            prep_time: 0,
            cook_time: 0,
            estimated_calories: 0,
            suggested_portions: 1,
            portion_description: "serving",
            categories: {
              meal_type: "",
              dietary_restrictions: "",
              difficulty_level: "",
              cuisine_type: "",
              cooking_method: ""
            }
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to generate categories: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Received response:', data);
      
      if (!data.success || !data.data || !data.data.categories) {
        throw new Error('Invalid response format from AI service');
      }

      const categories = data.data.categories;
      
      // Validate that we got all required categories
      const requiredCategories = ['meal_type', 'dietary_restrictions', 'difficulty_level', 'cuisine_type', 'cooking_method'];
      const missingCategories = requiredCategories.filter(cat => !categories[cat]);
      
      if (missingCategories.length > 0) {
        throw new Error(`Missing categories: ${missingCategories.join(', ')}`);
      }

      // Update the recipe with new categories
      const { error: updateError } = await supabase
        .from('recipes')
        .update({ categories })
        .eq('id', recipeId);

      if (updateError) {
        console.error('Update error:', updateError);
        throw new Error(`Failed to update recipe: ${updateError.message}`);
      }

      toast({
        title: "Categories updated",
        description: "Recipe categories have been regenerated successfully.",
      });

      // Refresh the page to show new categories
      window.location.reload();
    } catch (error) {
      console.error('Error generating categories:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate categories. Please try again.",
      });
    } finally {
      setIsGeneratingCategories(false);
    }
  };

  return (
    <div className="flex flex-col space-y-4 p-4">
      {/* Recipe Controls Section */}
      <div className="flex items-center justify-between">
        <Label htmlFor="measurement" className="text-base font-medium">
          Imperial:
        </Label>
        <Switch
          id="measurement"
          checked={measurementSystem === 'imperial'}
          onCheckedChange={toggleMeasurementSystem}
          className="data-[state=checked]:bg-primary"
        />
      </div>

      {/* Action Buttons Section */}
      <div className="flex flex-col gap-2 pt-2">
        <Button
          variant="outline"
          className="h-12 text-base font-medium"
          asChild
        >
          <Link to={`/recipes/${recipeId}/edit`} className="flex items-center justify-center">
            <Edit className="h-5 w-5 mr-2" />
            Edit
          </Link>
        </Button>
        <Button
          variant="outline"
          onClick={generateCategories}
          disabled={isGeneratingCategories}
          className="h-12 text-base font-medium"
        >
          <Tags className="h-5 w-5 mr-2" />
          {isGeneratingCategories ? 'Generating...' : 'Generate Categories'}
        </Button>
        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={isDeleting}
          className="h-12 text-base font-medium"
        >
          <Trash className="h-5 w-5 mr-2" />
          {isDeleting ? 'Deleting...' : 'Delete'}
        </Button>
      </div>
    </div>
  );
} 