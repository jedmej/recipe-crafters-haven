import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface SearchSectionProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isGenerating: boolean;
  handleSearch: (e: React.FormEvent) => void;
}

export const SearchSection: React.FC<SearchSectionProps> = ({
  searchQuery,
  setSearchQuery,
  isGenerating,
  handleSearch,
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
                Searching...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Search
              </>
            )}
          </Button>
        </div>
      </form>
    </CardContent>
  </Card>
);