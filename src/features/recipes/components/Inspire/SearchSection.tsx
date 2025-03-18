import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CircleNotch, MagnifyingGlass } from "@phosphor-icons/react";

interface SearchSectionProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isGenerating: boolean;
  handleSearch: (e: React.FormEvent) => void;
  shouldGenerateImage: boolean;
  setShouldGenerateImage: (value: boolean) => void;
}

export const SearchSection: React.FC<SearchSectionProps> = ({
  searchQuery,
  setSearchQuery,
  isGenerating,
  handleSearch,
  shouldGenerateImage,
  setShouldGenerateImage,
}) => {
  return (
    <Card className="overflow-hidden rounded-[48px] bg-[#F5F5F5] border-none">
      <CardContent className="p-6">
        <form onSubmit={handleSearch} className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Search for Recipes</h1>
            <p className="text-muted-foreground">
              Describe what kind of recipe you're looking for
            </p>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="e.g., healthy vegetarian dinner under 30 minutes"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
              disabled={isGenerating}
            />
            <Button
              type="submit"
              disabled={isGenerating}
              className="rounded-[500px] bg-[#FA8923] hover:bg-[#FA8923]/90 text-white"
              variant="primary"
            >
              {isGenerating ? (
                <>
                  <CircleNotch className="mr-2 h-4 w-4 animate-spin" weight="duotone" />
                  Searching...
                </>
              ) : (
                <>
                  <MagnifyingGlass className="mr-2 h-4 w-4" weight="duotone" />
                  Search
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Switch 
              id="generate-image-search" 
              checked={shouldGenerateImage} 
              onCheckedChange={setShouldGenerateImage}
              disabled={isGenerating}
            />
            <Label htmlFor="generate-image-search" className="font-medium">Generate Image</Label>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};