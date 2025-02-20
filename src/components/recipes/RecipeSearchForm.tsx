import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { SUPPORTED_LANGUAGES } from "@/types/recipe";

interface RecipeSearchFormProps {
  query: string;
  setQuery: (query: string) => void;
  language: string;
  setLanguage: (language: string) => void;
  generateImage: boolean;
  setGenerateImage: (generate: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  simpleMode?: boolean;
}

export function RecipeSearchForm({
  query,
  setQuery,
  language,
  setLanguage,
  generateImage,
  setGenerateImage,
  onSubmit,
  isLoading,
  simpleMode = false
}: RecipeSearchFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Describe what you'd like to cook..."
          required
        />
      </div>
      <div className="flex gap-4">
        <Select
          value={language}
          onValueChange={setLanguage}
        >
          <SelectTrigger className="w-[180px]">
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
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Searching...
            </>
          ) : (
            'Search'
          )}
        </Button>
      </div>

      {/* Only show the AI image generation toggle */}
      <div className="flex items-center space-x-2">
        <Switch
          id="generate-image"
          checked={generateImage}
          onCheckedChange={setGenerateImage}
          disabled={isLoading}
        />
        <Label htmlFor="generate-image">Generate AI image for recipe</Label>
      </div>
    </form>
  );
}
