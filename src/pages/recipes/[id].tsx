import { useParams, Navigate } from 'react-router-dom';
import RecipeDetailPage from '@/features/recipes/components/RecipeDetail';

// Special routes that should not be treated as recipe IDs
const SPECIAL_ROUTES = ['inspire', 'ai-search', 'import-ai', 'import', 'edit', 'new', 'generate-image'];

export default function RecipeDetailRoute() {
  const { id } = useParams();
  
  // If it's a special route, don't try to load a recipe
  if (id && SPECIAL_ROUTES.includes(id)) {
    return null; // Let the normal routing handle these special routes
  }
  
  // Check if the ID is a valid UUID or numeric ID
  const isValidId = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$|^\d+$/.test(id || '');
  
  if (!isValidId) {
    return <Navigate to="/recipes" replace />;
  }

  return <RecipeDetailPage />;
}
