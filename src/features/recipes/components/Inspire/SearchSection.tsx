
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { SearchIcon, SlidersHorizontal, X } from 'lucide-react';
import { FilterPanel } from '@/components/recipes/FilterPanel';

interface SearchSectionProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  onSearch: () => void;
  isLoading: boolean;
  showAISearch?: boolean;
}

export const SearchSection = ({
  searchTerm,
  setSearchTerm,
  onSearch,
  isLoading,
  showAISearch = true,
}: SearchSectionProps) => {
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <Card className="mb-6 bg-white rounded-3xl border-none shadow-sm">
      <CardContent className="p-4 lg:p-6 pt-4 lg:pt-6">
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Input
                type="text"
                placeholder="Search for recipes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-12 rounded-full py-2 pl-12 pr-12"
              />
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              {searchTerm && (
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setSearchTerm('')}
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={isLoading || !searchTerm.trim()}
                className="h-12 px-6 rounded-full"
              >
                {isLoading ? 'Searching...' : 'Search'}
              </Button>
              
              {showAISearch && (
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 rounded-full"
                  onClick={() => navigate('/recipes/inspire')}
                >
                  AI Search
                </Button>
              )}
              
              <Button
                type="button"
                variant={showFilters ? "default" : "outline"}
                className="h-12 w-12 rounded-full flex items-center justify-center"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4">
              <FilterPanel />
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
};
