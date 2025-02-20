import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SUPPORTED_LANGUAGES } from "@/types/recipe";
import type { Database } from "@/integrations/supabase/types";

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
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">Title</label>
        <Input
          value={formData.title}
          onChange={e => onUpdateFormData({ title: e.target.value })}
          required
          placeholder="Enter recipe title..."
          className="text-lg font-medium"
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Prep Time (minutes)</label>
          <Input
            type="number"
            min="0"
            value={formData.prep_time}
            onChange={e => onUpdateFormData({ prep_time: parseInt(e.target.value) || 0 })}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Cook Time (minutes)</label>
          <Input
            type="number"
            min="0"
            value={formData.cook_time}
            onChange={e => onUpdateFormData({ cook_time: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Estimated Calories</label>
          <Input
            type="number"
            min="0"
            value={formData.estimated_calories}
            onChange={e => onUpdateFormData({ estimated_calories: parseInt(e.target.value) || 0 })}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Servings</label>
          <Input
            type="number"
            min="1"
            value={formData.servings}
            onChange={e => onUpdateFormData({ servings: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Ingredients</label>
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

      <div className="space-y-2">
        <label className="text-sm font-medium">Instructions</label>
        {(formData.instructions as string[])?.map((instruction, index) => (
          <div key={index} className="flex gap-2">
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
