
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  language: string;
  isSearching: boolean;
  onQueryChange: (query: string) => void;
  onLanguageChange: (language: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function RecipeSearchForm({
  query,
  language,
  isSearching,
  onQueryChange,
  onLanguageChange,
  onSubmit,
}: RecipeSearchFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">What would you like to cook?</label>
        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="e.g., Find a vegan lasagna recipe"
          required
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Recipe Language</label>
        <Select value={language} onValueChange={onLanguageChange}>
          <SelectTrigger className="w-full">
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
        <p className="text-sm text-muted-foreground">
          Choose the language for your recipe
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={isSearching}>
        {isSearching ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Searching...
          </>
        ) : (
          "Search Recipe"
        )}
      </Button>
    </form>
  );
}
