import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, Trash, PlusIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { ImageUploadOrGenerate } from "@/components/recipes/ImageUploadOrGenerate";

// Reusable list editor component for ingredients and instructions
const ListEditor = ({ 
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
const FormField = ({ 
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
const NumberField = ({ 
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

export default function NewRecipePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recipeImage, setRecipeImage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    ingredients: [""],
    instructions: [""],
    image_url: "",
    source_url: "",
    prep_time: 0,
    cook_time: 0,
    estimated_calories: 0,
    servings: 1,
    language: "en"
  });

  const updateFormField = <K extends keyof typeof formData>(
    key: K, 
    value: typeof formData[K]
  ) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const createRecipe = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from('recipes')
        .insert([{
          ...formData,
          image_url: recipeImage,
          user_id: user.id,
          ingredients: formData.ingredients.filter(i => i.trim() !== ""),
          instructions: formData.instructions.filter(i => i.trim() !== ""),
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      navigate('/recipes');
      toast({
        title: "Recipe created",
        description: "Your recipe has been successfully created.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await createRecipe.mutateAsync();
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate("/recipes")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Recipes
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Create New Recipe</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
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
                  onImageSelected={setRecipeImage}
                  title={formData.title}
                  disabled={isSubmitting}
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

              <FormField label="Language" id="language">
                <Select 
                  value={formData.language} 
                  onValueChange={value => updateFormField("language", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Ingredients">
                <ListEditor
                  items={formData.ingredients}
                  onChange={items => updateFormField("ingredients", items)}
                  addButtonText="Add Ingredient"
                  itemPlaceholder={index => `Ingredient ${index + 1}`}
                />
              </FormField>

              <FormField label="Instructions">
                <ListEditor
                  items={formData.instructions}
                  onChange={items => updateFormField("instructions", items)}
                  addButtonText="Add Step"
                  itemPlaceholder={index => `Step ${index + 1}`}
                />
              </FormField>

              <div className="flex gap-4 pt-6">
                <Button
                  variant="outline"
                  className="flex-1"
                  asChild
                >
                  <Link to="/recipes">Cancel</Link>
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Recipe...
                    </>
                  ) : 'Create Recipe'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
