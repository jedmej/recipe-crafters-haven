import { AIRecipeSearch } from '@/features/recipes/components/AIRecipeSearch/AIRecipeSearch';
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AIRecipeSearchPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="flex items-center mb-4 sm:mb-6 lg:mb-8">
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-gray-100 transition-colors -ml-2"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            <span className="text-sm">Back</span>
          </Button>
        </div>

        <div className="w-full max-w-6xl mx-auto space-y-4 sm:space-y-6">
          <AIRecipeSearch />
        </div>
      </div>
    </div>
  );
} 