import { Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Database } from "@/integrations/supabase/types";
import { useFavorites } from "@/hooks/use-favorites";
import { Heart } from "@phosphor-icons/react";
import { useState, useCallback, memo } from "react";

type Recipe = Database['public']['Tables']['recipes']['Row'];

interface RecipeCardProps {
  recipe: Recipe;
  isSelected: boolean;
  isSelectionMode: boolean;
  onClick: (recipeId: string, event: React.MouseEvent) => void;
}

export const RecipeCard = memo(function RecipeCard({ recipe, isSelected, isSelectionMode, onClick }: RecipeCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const isFavorited = isFavorite(recipe.id);
  const [isToggling, setIsToggling] = useState(false);

  const handleFavoriteClick = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isToggling) return; // Prevent multiple clicks
    
    setIsToggling(true);
    
    try {
      await toggleFavorite.mutateAsync(recipe.id);
    } catch (error) {
      console.error("Error toggling favorite:", error);
    } finally {
      setIsToggling(false);
    }
  }, [isToggling, recipe.id, toggleFavorite]);

  const handleCardClick = useCallback((e: React.MouseEvent) => {
    onClick(recipe.id, e);
  }, [onClick, recipe.id]);

  // Optimize rendering by conditionally showing selection UI only when needed
  const renderSelectionUI = useCallback(() => {
    if (!isSelectionMode) return null;
    
    return (
      <div className="absolute top-3 left-3 bg-white/30 backdrop-blur-md p-1.5 rounded-full flex items-center justify-center shadow-lg border border-white/30 z-10 transition-opacity duration-200">
        <div className={cn(
          "h-5 w-5 rounded-full border-2 transition-colors duration-200",
          isSelected
            ? "bg-primary border-transparent"
            : "border-white/80 bg-white/20"
        )}>
          {isSelected && (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-full w-full p-1"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
      </div>
    );
  }, [isSelectionMode, isSelected]);

  // Optimize rendering by conditionally showing favorite button only when needed
  const renderFavoriteButton = useCallback(() => {
    if (isSelectionMode) return null;
    
    return (
      <div className="absolute top-3 left-3 z-10">
        <button
          onClick={handleFavoriteClick}
          disabled={isToggling}
          className={`
            relative
            bg-white/30 backdrop-blur-md 
            p-1.5 rounded-full 
            flex items-center justify-center 
            shadow-lg border border-white/30 
            transition-all duration-200 
            ${isToggling ? 'opacity-70' : 'hover:scale-110'}
          `}
          aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart 
            weight={isFavorited ? "duotone" : "regular"} 
            className={`w-5 h-5 ${isFavorited ? 'text-red-500' : 'text-white'}`} 
          />
        </button>
      </div>
    );
  }, [handleFavoriteClick, isFavorited, isSelectionMode, isToggling]);

  return (
    <div className="relative group">
      <Card 
        style={{
          borderRadius: '24px',
          overflow: 'hidden',
          position: 'relative',
          transition: 'all 300ms cubic-bezier(0.19, 1, 0.22, 1)',
          transform: `scale(${isSelected ? '0.98' : '1'})`,
          transformOrigin: 'center'
        }}
        className={`
          cursor-pointer 
          shadow-sm
          hover:shadow-lg
          h-[280px] sm:h-[300px] md:h-[320px]
          rounded-[24px]
          transform-gpu
          ${isSelected 
            ? 'ring-2 ring-primary ring-offset-2 ring-offset-background bg-primary/5' 
            : 'hover:scale-[1.02] transition-all duration-300'
          }
          group
        `}
        onClick={handleCardClick}
      >
        <div className="absolute inset-0 rounded-[24px] overflow-hidden">
          {recipe.image_url ? (
            <>
              <img
                src={recipe.image_url}
                alt={recipe.title}
                className={`
                  absolute inset-0 w-full h-full object-cover
                  transition-all duration-300
                  group-hover:scale-[1.04]
                  ${isSelected ? 'brightness-95' : ''}
                `}
                style={{
                  transitionTimingFunction: 'cubic-bezier(0.19, 1, 0.22, 1)'
                }}
                loading="lazy"
              />
              {renderSelectionUI()}
              {renderFavoriteButton()}
              {recipe.cook_time && (
                <div className="absolute top-3 right-3 bg-white/30 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg border border-white/30 z-10">
                  <Clock className="w-4 h-4 text-white" />
                  <span className="text-sm font-medium text-white drop-shadow-sm">{recipe.cook_time} min</span>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 h-[50%]">
                <div 
                  className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
                />
                <div 
                  className="absolute inset-0 backdrop-blur-[5px]"
                  style={{ 
                    maskImage: 'linear-gradient(to top, black 60%, transparent)',
                    WebkitMaskImage: 'linear-gradient(to top, black 60%, transparent)'
                  }}
                />
              </div>
            </>
          ) : (
            <div className="absolute inset-0 bg-gray-100" />
          )}
        </div>
        <div className="absolute inset-x-0 bottom-0 p-4">
          <h3 className="font-normal text-[21px] font-['Judson'] line-clamp-2 text-white">
            {recipe.title}
          </h3>
        </div>
      </Card>
    </div>
  );
}); 