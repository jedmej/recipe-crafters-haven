import { AIRecipeSearch } from '@/features/recipes/components/AIRecipeSearch/AIRecipeSearch';
import { RecipePageLayout } from '@/components/layout/RecipePageLayout';

// Simple component that renders the AIRecipeSearch within a layout
export default function AIRecipeSearchPage() {
  return (
    <RecipePageLayout>
      <AIRecipeSearch />
    </RecipePageLayout>
  );
} 