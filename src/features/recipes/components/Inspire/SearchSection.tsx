
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface SearchSectionProps {
  onSearch: (prompt: string) => void;
  onQueryChange: (query: string) => void;
  query: string;
  isLoading?: boolean;
  defaultExpanded?: boolean;
  includeImageGeneration?: boolean;
  onToggleImageGeneration?: (enabled: boolean) => void;
}

export function SearchSection({
  onSearch,
  onQueryChange,
  query,
  isLoading = false,
  defaultExpanded = false,
  includeImageGeneration = true,
  onToggleImageGeneration
}: SearchSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const navigate = useNavigate();

  // Reset expanded state when query changes
  useEffect(() => {
    if (!query) {
      setIsExpanded(defaultExpanded);
    }
  }, [query, defaultExpanded]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    }
  };

  const handleFocus = () => {
    setIsExpanded(true);
  };

  const handleGenerateClick = () => {
    if (query.trim()) {
      onSearch(query);
    }
  };

  const handleUrlDetect = (value: string) => {
    // Simple URL detection
    if (value.startsWith('http://') || value.startsWith('https://')) {
      // Provide a visual indication or option to import from URL
      navigate(`/recipes/import-ai?url=${encodeURIComponent(value)}`);
    }
  };

  // Create placeholder filters with undefined values for type safety
  const emptyFilters = {
    mealTypeFilters: [] as string[],
    dietaryFilters: [] as string[],
    difficultyFilters: [] as string[],
    cuisineFilters: [] as string[],
    cookingMethodFilters: [] as string[],
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        {isExpanded ? (
          <Textarea
            value={query}
            onChange={(e) => {
              onQueryChange(e.target.value);
              handleUrlDetect(e.target.value);
            }}
            placeholder="Describe the recipe you want to generate (e.g., 'A vegetarian pasta with mushrooms and spinach in a creamy sauce')"
            className="min-h-[100px] resize-none"
            autoFocus
          />
        ) : (
          <Input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onFocus={handleFocus}
            placeholder="Describe a recipe you want to generate..."
            className="pr-10"
          />
        )}
        {!isExpanded && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 transform -translate-y-1/2"
            onClick={handleFocus}
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isExpanded && (
        <div className="flex flex-col gap-4">
          {includeImageGeneration && onToggleImageGeneration && (
            <div className="flex items-center gap-2">
              <Switch
                id="generate-image"
                onCheckedChange={onToggleImageGeneration}
                defaultChecked={true}
              />
              <Label htmlFor="generate-image">Generate an AI image for this recipe</Label>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={!query.trim() || isLoading}
          >
            {isLoading ? 'Generating...' : 'Generate Recipe'}
          </Button>
        </div>
      )}
    </form>
  );
}
