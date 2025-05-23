
// Import the necessary modules and only access public properties
import React from 'react';
import { Button } from "@/components/ui/button";
import { Trash2, Download, Edit, Share, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// Define the props interface
interface RecipeActionsProps {
  recipeId: string;
  isDeleting: boolean;
  handleDelete: () => void;
  measurementSystem: 'metric' | 'imperial';
  toggleMeasurementSystem: () => void;
  recipe: {
    title: string;
    description: string;
    ingredients: string[];
    instructions: string[];
    categories?: any;
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
  const navigate = useNavigate();
  
  // Function to generate and download a recipe PDF
  const downloadRecipePDF = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('recipe-export-pdf', {
        body: {
          recipe: {
            ...recipe,
            id: recipeId,
            measurement_system: measurementSystem,
          }
        }
      });
      
      if (error) throw error;
      
      if (data && data.pdfUrl) {
        // Create a download link
        const link = document.createElement('a');
        link.href = data.pdfUrl;
        link.download = `${recipe.title.replace(/\s+/g, '-').toLowerCase()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      // You could add toast notification here
    }
  };

  // Function to share recipe
  const shareRecipe = () => {
    // Get the current URL which should be the recipe detail page
    const url = window.location.href;
    
    // Check if the Web Share API is supported
    if (navigator.share) {
      navigator.share({
        title: recipe.title,
        text: recipe.description,
        url: url,
      }).catch((error) => console.log('Error sharing', error));
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(url)
        .then(() => {
          // You could add toast notification here
          console.log("URL copied to clipboard");
        })
        .catch(err => {
          console.error('Failed to copy URL: ', err);
        });
    }
  };

  // Use environment variables directly instead of accessing protected properties
  const translateRecipe = async () => {
    try {
      // Use supabase functions instead of direct URL/key access
      const { data, error } = await supabase.functions.invoke('recipe-translate', {
        body: {
          recipe: {
            ...recipe,
            id: recipeId,
          },
          targetLanguage: 'es' // Hardcoded for this example, you can make it dynamic
        }
      });
      
      if (error) throw error;
      
      // Handle the translated recipe data, for example navigate to it
      if (data && data.id) {
        navigate(`/recipes/${data.id}`);
      }
    } catch (error) {
      console.error("Translation error:", error);
    }
  };

  return (
    <div className="space-y-4">
      <Button 
        variant="outline" 
        className="w-full"
        onClick={() => navigate(`/recipes/edit/${recipeId}`)}
      >
        <Edit className="mr-2 h-4 w-4" />
        Edit Recipe
      </Button>
      
      <div className="grid grid-cols-2 gap-3">
        <Button 
          variant="outline" 
          onClick={downloadRecipePDF}
        >
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
        
        <Button 
          variant="outline"
          onClick={shareRecipe}
        >
          <Share className="mr-2 h-4 w-4" />
          Share
        </Button>
        
        <Button 
          variant="outline"
          onClick={translateRecipe}
        >
          <Globe className="mr-2 h-4 w-4" />
          Translate
        </Button>
        
        <Button 
          variant="outline" 
          className="text-destructive hover:bg-destructive/10"
          disabled={isDeleting}
          onClick={handleDelete}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </div>
    </div>
  );
}
