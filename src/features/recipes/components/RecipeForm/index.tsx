import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, Trash, PlusIcon } from "lucide-react";
import { ImageUploadOrGenerate } from "@/components/recipes/ImageUploadOrGenerate";
import { FILTER_CATEGORIES } from "@/features/recipes/utils/constants";

// Types
import type { RecipeFormData } from "@/features/recipes/types";

// Reusable list editor component for ingredients and instructions
export const ListEditor = ({ 
  items, 
  onChange, 
  addButtonText, 
  itemPlaceholder 
}: {
  items: string[];
  onChange: (newItems: string[]) => void;
  addButtonText: string;
  itemPlaceholder: (index: number) => string;
}) => {
  const add = () => onChange([...items, ""]);
  
  const update = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index] = value;
    onChange(newItems);
  };
  
  const remove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="flex gap-2">
          <Input
            value={item}
            onChange={e => update(index, e.target.value)}
            placeholder={itemPlaceholder(index)}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => remove(index)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={add}
        className="w-full"
      >
        <PlusIcon className="h-4 w-4 mr-2" />
        {addButtonText}
      </Button>
    </div>
  );
};

// Form field component to reduce repetition
export const FormField = ({ 
  label, 
  id, 
  children 
}: { 
  label: string; 
  id?: string; 
  children: React.ReactNode 
}) => (
  <div className="space-y-2">
    <Label htmlFor={id}>{label}</Label>
    {children}
  </div>
);

// Number input field component
export const NumberField = ({ 
  label, 
  id, 
  value, 
  onChange, 
  min = 0 
}: {
  label: string;
  id: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
}) => (
  <FormField label={label} id={id}>
    <Input
      type="number"
      id={id}
      min={min.toString()}
      value={value}
      onChange={e => onChange(parseInt(e.target.value) || 0)}
    />
  </FormField>
);

// Categories field component
export const CategoriesField = ({
  formData,
  updateFormField,
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Categories</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Meal Type" id="meal_type">
          <Select 
            value={formData.categories?.meal_type || ""} 
            onValueChange={(value) => updateFormField("categories", { 
              ...formData.categories, 
              meal_type: value 
            })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select meal type" />
            </SelectTrigger>
            <SelectContent>
              {FILTER_CATEGORIES.mealType.options.map(option => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        
        <FormField label="Difficulty" id="difficulty_level">
          <Select 
            value={formData.categories?.difficulty_level || ""} 
            onValueChange={(value) => updateFormField("categories", { 
              ...formData.categories, 
              difficulty_level: value 
            })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select difficulty" />
            </SelectTrigger>
            <SelectContent>
              {FILTER_CATEGORIES.difficultyLevel.options.map(option => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        
        <FormField label="Cuisine Type" id="cuisine_type">
          <Select 
            value={formData.categories?.cuisine_type || ""} 
            onValueChange={(value) => updateFormField("categories", { 
              ...formData.categories, 
              cuisine_type: value 
            })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select cuisine" />
            </SelectTrigger>
            <SelectContent>
              {FILTER_CATEGORIES.cuisineType.options.map(option => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        
        <FormField label="Cooking Method" id="cooking_method">
          <Select 
            value={formData.categories?.cooking_method || ""} 
            onValueChange={(value) => updateFormField("categories", { 
              ...formData.categories, 
              cooking_method: value 
            })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select method" />
            </SelectTrigger>
            <SelectContent>
              {FILTER_CATEGORIES.cookingMethod.options.map(option => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        
        <FormField label="Occasion" id="occasion">
          <Select 
            value={formData.categories?.occasion || ""} 
            onValueChange={(value) => updateFormField("categories", { 
              ...formData.categories, 
              occasion: value 
            })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select occasion" />
            </SelectTrigger>
            <SelectContent>
              {FILTER_CATEGORIES.occasion.options.map(option => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        
        <FormField label="Course Category" id="course_category">
          <Select 
            value={formData.categories?.course_category || ""} 
            onValueChange={(value) => updateFormField("categories", { 
              ...formData.categories, 
              course_category: value 
            })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select course category" />
            </SelectTrigger>
            <SelectContent>
              {FILTER_CATEGORIES.courseCategory.options.map(option => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        
        <FormField label="Taste Profile" id="taste_profile">
          <Select 
            value={formData.categories?.taste_profile || ""} 
            onValueChange={(value) => updateFormField("categories", { 
              ...formData.categories, 
              taste_profile: value 
            })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select taste profile" />
            </SelectTrigger>
            <SelectContent>
              {FILTER_CATEGORIES.tasteProfile.options.map(option => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </div>
    </div>
  );
};

interface RecipeFormProps {
  formData: RecipeFormData;
  updateFormField: <K extends keyof RecipeFormData>(key: K, value: RecipeFormData[K]) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  isSubmitting: boolean;
  onCancel: () => void;
  mode: 'create' | 'edit' | 'import';
  title?: string;
}

export const RecipeForm = ({
  formData,
  updateFormField,
  onSubmit,
  isSubmitting,
  onCancel,
  mode,
  title
}: RecipeFormProps) => {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <FormField label="Title" id="title">
        <Input
          id="title"
          value={formData.title}
          onChange={e => updateFormField("title", e.target.value)}
          required
        />
      </FormField>

      <div className="space-y-4">
        <label className="text-sm font-medium">Recipe Image</label>
        <ImageUploadOrGenerate
          onImageSelected={(imageUrl) => updateFormField("image_url", imageUrl)}
          title={formData.title}
          disabled={isSubmitting}
          currentImage={formData.image_url}
        />
      </div>

      <FormField label="Description" id="description">
        <Textarea
          id="description"
          value={formData.description}
          onChange={e => updateFormField("description", e.target.value)}
          rows={4}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <NumberField 
          label="Prep Time (minutes)" 
          id="prep_time" 
          value={formData.prep_time} 
          onChange={value => updateFormField("prep_time", value)} 
        />
        
        <NumberField 
          label="Cook Time (minutes)" 
          id="cook_time" 
          value={formData.cook_time} 
          onChange={value => updateFormField("cook_time", value)} 
        />
        
        <NumberField 
          label="Estimated Calories" 
          id="estimated_calories" 
          value={formData.estimated_calories} 
          onChange={value => updateFormField("estimated_calories", value)} 
        />
        
        <NumberField 
          label="Servings" 
          id="servings" 
          value={formData.servings} 
          onChange={value => updateFormField("servings", value)} 
          min={1}
        />
      </div>

      {formData.source_url !== undefined && (
        <FormField label="Source URL" id="source_url">
          <Input
            id="source_url"
            value={formData.source_url}
            onChange={e => updateFormField("source_url", e.target.value)}
            placeholder="https://example.com/recipe"
          />
        </FormField>
      )}

      <CategoriesField 
        formData={formData} 
        updateFormField={updateFormField} 
      />
      
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Ingredients</h3>
        <ListEditor
          items={formData.ingredients || [""]}
          onChange={value => updateFormField("ingredients", value)}
          addButtonText="Add Ingredient"
          itemPlaceholder={index => `Ingredient ${index + 1}`}
        />
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Instructions</h3>
        <ListEditor
          items={formData.instructions || [""]}
          onChange={value => updateFormField("instructions", value)}
          addButtonText="Add Step"
          itemPlaceholder={index => `Step ${index + 1}`}
        />
      </div>
      
      <div className="flex gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {mode === 'create' ? 'Creating...' : mode === 'edit' ? 'Saving...' : 'Importing...'}
            </>
          ) : (
            mode === 'create' ? 'Create Recipe' : mode === 'edit' ? 'Save Changes' : 'Import Recipe'
          )}
        </Button>
      </div>
    </form>
  );
};

export default RecipeForm; 