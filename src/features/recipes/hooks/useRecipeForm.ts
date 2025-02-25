import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DEFAULT_RECIPE_FORM_DATA } from "../utils/constants";
import type { RecipeFormData } from "../types";

interface UseRecipeFormProps {
  initialData?: Partial<RecipeFormData>;
  recipeId?: string;
  mode: 'create' | 'edit' | 'import';
  onSuccess?: (data: any) => void;
}

export function useRecipeForm({
  initialData,
  recipeId,
  mode,
  onSuccess
}: UseRecipeFormProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Merge default form data with initial data
  const [formData, setFormData] = useState<RecipeFormData>({
    ...DEFAULT_RECIPE_FORM_DATA,
    ...initialData
  });

  // Update form data when initialData changes (useful for fetch operations)
  useEffect(() => {
    if (initialData) {
      setFormData(prevData => ({
        ...prevData,
        ...initialData
      }));
    }
  }, [initialData]);

  // Generic form field update function
  const updateFormField = <K extends keyof RecipeFormData>(
    key: K, 
    value: RecipeFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  // List-specific update functions
  const addListItem = (key: "ingredients" | "instructions") => 
    setFormData(prev => ({
      ...prev,
      [key]: [...(prev[key] || []), ""]
    }));
  
  const updateListItem = (key: "ingredients" | "instructions", index: number, value: string) => 
    setFormData(prev => ({
      ...prev,
      [key]: (prev[key] || []).map((item, i) => i === index ? value : item)
    }));
  
  const removeListItem = (key: "ingredients" | "instructions", index: number) => 
    setFormData(prev => ({
      ...prev,
      [key]: (prev[key] || []).filter((_, i) => i !== index)
    }));

  // Form validation
  const validateForm = () => {
    if (!formData.title?.trim()) {
      return "Please provide a recipe title.";
    }
    
    if (!formData.ingredients?.some(i => i.trim() !== "")) {
      return "Please add at least one ingredient.";
    }
    
    if (!formData.instructions?.some(i => i.trim() !== "")) {
      return "Please add at least one instruction step.";
    }
    
    return null;
  };

  // Create recipe mutation
  const createRecipe = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Filter out empty ingredients and instructions
      const filteredData = {
        ...formData,
        ingredients: formData.ingredients.filter(i => i.trim() !== ""),
        instructions: formData.instructions.filter(i => i.trim() !== ""),
        user_id: user.id
      };

      const { data, error } = await supabase
        .from('recipes')
        .insert([filteredData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      
      if (onSuccess) {
        onSuccess(data);
      } else {
        navigate('/recipes');
        toast({
          title: "Recipe created",
          description: "Your recipe has been successfully created.",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  });

  // Update recipe mutation
  const updateRecipe = useMutation({
    mutationFn: async () => {
      if (!recipeId) throw new Error("Recipe ID is required for updates");
      
      // Filter out empty ingredients and instructions
      const filteredData = {
        ...formData,
        ingredients: formData.ingredients.filter(i => i.trim() !== ""),
        instructions: formData.instructions.filter(i => i.trim() !== ""),
      };

      const { data, error } = await supabase
        .from('recipes')
        .update(filteredData)
        .eq('id', recipeId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      queryClient.invalidateQueries({ queryKey: ['recipes', recipeId] });
      
      if (onSuccess) {
        onSuccess(data);
      } else {
        navigate(`/recipes/${recipeId}`);
        toast({
          title: "Recipe updated",
          description: "Your recipe has been successfully updated.",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  });

  // Import recipe mutation (for AI import)
  const importRecipe = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Filter out empty ingredients and instructions
      const filteredData = {
        ...formData,
        ingredients: formData.ingredients.filter(i => i.trim() !== ""),
        instructions: formData.instructions.filter(i => i.trim() !== ""),
        user_id: user.id
      };

      const { data, error } = await supabase
        .from('recipes')
        .insert([filteredData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      
      if (onSuccess) {
        onSuccess(data);
      } else {
        navigate('/recipes');
        toast({
          title: "Recipe imported",
          description: "Your recipe has been successfully imported.",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  });

  // Handle form submission based on mode
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      toast({ 
        variant: "destructive", 
        title: "Invalid form", 
        description: validationError 
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'create') {
        await createRecipe.mutateAsync();
      } else if (mode === 'edit') {
        await updateRecipe.mutateAsync();
      } else if (mode === 'import') {
        await importRecipe.mutateAsync();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    updateFormField,
    addListItem,
    updateListItem,
    removeListItem,
    handleSubmit,
    isSubmitting,
    validateForm,
    resetForm: () => setFormData(DEFAULT_RECIPE_FORM_DATA)
  };
} 