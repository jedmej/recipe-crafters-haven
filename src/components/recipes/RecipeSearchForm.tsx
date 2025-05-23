
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Image as ImageIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
}

export const RecipeSearchForm: React.FC<RecipeSearchFormProps> = ({
  query,
  setQuery,
  language,
  setLanguage,
  generateImage,
  setGenerateImage,
  onSubmit,
  isLoading,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="e.g., Find a vegan lasagna recipe"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-lg"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:w-auto">
          <Select
            value={language}
            onValueChange={(value) => setLanguage(value)}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
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
          <Button 
            type="submit" 
            disabled={isLoading || !query.trim()}
            className="w-full sm:w-auto"
          >
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
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="generate-image"
          checked={generateImage}
          onCheckedChange={setGenerateImage}
        />
        <Label htmlFor="generate-image" className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4" />
          Generate recipe image
        </Label>
      </div>
    </form>
  );
};
