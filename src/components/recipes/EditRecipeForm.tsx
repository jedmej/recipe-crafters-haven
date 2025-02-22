import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SUPPORTED_LANGUAGES } from "@/types/recipe";
import type { Database } from "@/integrations/supabase/types";
import {
  ALL_MEAL_TYPES,
  ALL_DIETARY_RESTRICTIONS,
  ALL_DIFFICULTY_LEVELS,
  ALL_CUISINE_TYPES,
  ALL_COOKING_METHODS,
  type MealType,
  type DietaryRestriction,
  type DifficultyLevel,
  type CuisineType,
  type CookingMethod
} from "@/types/filters";

type Recipe = Database['public']['Tables']['recipes']['Row'];

interface EditRecipeFormProps {
  formData: Partial<Recipe>;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onUpdateFormData: (updates: Partial<Recipe>) => void;
  onAddListItem: (key: "ingredients" | "instructions") => void;
  onUpdateListItem: (key: "ingredients" | "instructions", index: number, value: string) => void;
  onRemoveListItem: (key: "ingredients" | "instructions", index: number) => void;
}

export function EditRecipeForm({
  formData,
  isSubmitting,
  onSubmit,
  onUpdateFormData,
  onAddListItem,
  onUpdateListItem,
  onRemoveListItem
}: EditRecipeFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={formData.title}
                onChange={e => onUpdateFormData({ title: e.target.value })}
                required
                placeholder="Enter recipe title..."
                className="text-lg"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={formData.description}
                onChange={e => onUpdateFormData({ description: e.target.value })}
                placeholder="Enter recipe description..."
                className="w-full min-h-[120px] p-3 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Language</label>
              <Select 
                value={formData.language} 
                onValueChange={value => onUpdateFormData({ language: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Recipe Categories</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Meal Type</label>
              <Select
                value={formData.categories?.meal_type || ''}
                onValueChange={value => onUpdateFormData({
                  categories: { ...formData.categories, meal_type: value }
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select meal type" />
                </SelectTrigger>
                <SelectContent>
                  {ALL_MEAL_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Dietary Restrictions</label>
              <Select
                value={formData.categories?.dietary_restrictions || ''}
                onValueChange={value => onUpdateFormData({
                  categories: { ...formData.categories, dietary_restrictions: value }
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select dietary restrictions" />
                </SelectTrigger>
                <SelectContent>
                  {ALL_DIETARY_RESTRICTIONS.map((restriction) => (
                    <SelectItem key={restriction} value={restriction}>
                      {restriction}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Difficulty Level</label>
              <Select
                value={formData.categories?.difficulty_level || ''}
                onValueChange={value => onUpdateFormData({
                  categories: { ...formData.categories, difficulty_level: value }
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty level" />
                </SelectTrigger>
                <SelectContent>
                  {ALL_DIFFICULTY_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Cuisine Type</label>
              <Select
                value={formData.categories?.cuisine_type || ''}
                onValueChange={value => onUpdateFormData({
                  categories: { ...formData.categories, cuisine_type: value }
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select cuisine type" />
                </SelectTrigger>
                <SelectContent>
                  {ALL_CUISINE_TYPES.map((cuisine) => (
                    <SelectItem key={cuisine} value={cuisine}>
                      {cuisine}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Cooking Method</label>
              <Select
                value={formData.categories?.cooking_method || ''}
                onValueChange={value => onUpdateFormData({
                  categories: { ...formData.categories, cooking_method: value }
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select cooking method" />
                </SelectTrigger>
                <SelectContent>
                  {ALL_COOKING_METHODS.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Ingredients</h2>
          <div className="space-y-4">
            {(formData.ingredients as string[])?.map((ingredient, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={ingredient}
                  onChange={e => onUpdateListItem("ingredients", index, e.target.value)}
                  placeholder={`Ingredient ${index + 1}`}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => onRemoveListItem("ingredients", index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => onAddListItem("ingredients")}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Ingredient
            </Button>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Instructions</h2>
          <div className="space-y-4">
            {(formData.instructions as string[])?.map((instruction, index) => (
              <div key={index} className="flex gap-4">
                <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-700 font-medium">
                  {index + 1}
                </span>
                <div className="flex-1 flex gap-2">
                  <Input
                    value={instruction}
                    onChange={e => onUpdateListItem("instructions", index, e.target.value)}
                    placeholder={`Step ${index + 1}`}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => onRemoveListItem("instructions", index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => onAddListItem("instructions")}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Step
            </Button>
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving Changes...
          </>
        ) : (
          'Save Changes'
        )}
      </Button>
    </form>
  );
}
