import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Sparkle } from "@phosphor-icons/react/dist/ssr";

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
}) => (
  <Card className="overflow-hidden rounded-[48px] mb-8 bg-[#F5F5F5] border-none">
    <CardContent className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Find Your Perfect Recipe</h1>
      
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="space-y-2">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="What would you like to cook? (e.g., 'vegetarian pasta', 'quick breakfast')"
            className="text-lg"
            disabled={isGenerating}
          />
        </div>
        
        <div className="flex items-center gap-2 mb-4">
          <Switch 
            id="generate-image-search" 
            checked={shouldGenerateImage} 
            onCheckedChange={setShouldGenerateImage}
            disabled={isGenerating}
          />
          <Label htmlFor="generate-image-search" className="font-medium">Generate Image</Label>
        </div>
        
        <div className="flex gap-4">
          <Button 
            type="submit" 
            disabled={isGenerating} 
            className="flex-1 rounded-[500px] bg-[#FA8923] hover:bg-[#FA8923]/90 text-white h-12" 
            variant="primary"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Recipe...
              </>
            ) : (
              <>
                <Sparkle className="mr-2 h-4 w-4" weight="duotone" />
                Create Recipe
              </>
            )}
          </Button>
        </div>
      </form>
    </CardContent>
  </Card>
);