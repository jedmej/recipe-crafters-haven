import { Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Database } from "@/integrations/supabase/types";
import { useFavorites } from "@/hooks/use-favorites";
import { Heart } from "@phosphor-icons/react";
import { useState, useCallback, memo, useRef, useEffect } from "react";

type Recipe = Database['public']['Tables']['recipes']['Row'];

interface RecipeCardProps {
  recipe: Recipe;
  isSelected: boolean;
  isSelectionMode: boolean;
  onClick: (recipeId: string, event: React.MouseEvent) => void;
  onLongPress?: (recipeId: string) => void;
}

export const RecipeCard = memo(function RecipeCard({ 
  recipe, 
  isSelected, 
  isSelectionMode, 
  onClick, 
  onLongPress 
}: RecipeCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const isFavorited = isFavorite(recipe.id);
  const [isToggling, setIsToggling] = useState(false);
  
  // Long press handling
  const longPressTimeoutRef = useRef<number | null>(null);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const longPressTriggeredRef = useRef(false);
  const startPositionRef = useRef({ x: 0, y: 0 });
  const LONG_PRESS_DURATION = 500; // ms
  const MOVEMENT_THRESHOLD = 10; // pixels

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (longPressTimeoutRef.current) {
        window.clearTimeout(longPressTimeoutRef.current);
      }
    };
  }, []);

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

  const startLongPress = useCallback((clientX: number, clientY: number) => {
    if (isSelectionMode) return; // Don't trigger long press if already in selection mode
    
    // Store the starting position
    startPositionRef.current = { x: clientX, y: clientY };
    
    // Reset the long press state
    longPressTriggeredRef.current = false;
    
    // Clear any existing timeout
    if (longPressTimeoutRef.current) {
      window.clearTimeout(longPressTimeoutRef.current);
    }
    
    // Start the long press timer
    longPressTimeoutRef.current = window.setTimeout(() => {
      setIsLongPressing(true);
      longPressTriggeredRef.current = true;
      if (onLongPress) {
        onLongPress(recipe.id);
      }
    }, LONG_PRESS_DURATION);
  }, [isSelectionMode, onLongPress, recipe.id]);

  const cancelLongPress = useCallback(() => {
    // Clear the timeout
    if (longPressTimeoutRef.current) {
      window.clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
    setIsLongPressing(false);
  }, []);

  const checkMovement = useCallback((clientX: number, clientY: number): boolean => {
    const deltaX = Math.abs(clientX - startPositionRef.current.x);
    const deltaY = Math.abs(clientY - startPositionRef.current.y);
    
    // If the user moved too much, cancel the long press
    if (deltaX > MOVEMENT_THRESHOLD || deltaY > MOVEMENT_THRESHOLD) {
      cancelLongPress();
      return true;
    }
    return false;
  }, [cancelLongPress]);

  // Mouse event handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    startLongPress(e.clientX, e.clientY);
  }, [startLongPress]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (longPressTimeoutRef.current) {
      checkMovement(e.clientX, e.clientY);
    }
  }, [checkMovement]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    cancelLongPress();
    
    // If long press was triggered, prevent the normal click
    if (longPressTriggeredRef.current) {
      e.stopPropagation();
      // Don't reset longPressTriggeredRef here to prevent click from firing
    }
  }, [cancelLongPress]);

  // Touch event handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      startLongPress(touch.clientX, touch.clientY);
    }
  }, [startLongPress]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (longPressTimeoutRef.current && e.touches.length === 1) {
      const touch = e.touches[0];
      const moved = checkMovement(touch.clientX, touch.clientY);
      
      // If moved significantly, prevent default to avoid scrolling
      if (moved && longPressTimeoutRef.current) {
        e.preventDefault();
      }
    }
  }, [checkMovement]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    cancelLongPress();
    
    // If long press was triggered, prevent the normal click/tap
    if (longPressTriggeredRef.current) {
      e.preventDefault();
      // Don't reset longPressTriggeredRef here to prevent click from firing
    }
  }, [cancelLongPress]);

  const handleCardClick = useCallback((e: React.MouseEvent) => {
    // Only handle click if it wasn't a long press
    if (!longPressTriggeredRef.current) {
      onClick(recipe.id, e);
    }
    
    // Reset the long press state after the click is processed
    longPressTriggeredRef.current = false;
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
          transform: `scale(${isSelected || isLongPressing ? '0.98' : '1'})`,
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
            : isLongPressing
              ? 'ring-2 ring-primary/50 ring-offset-2 ring-offset-background'
              : 'hover:scale-[1.02] transition-all duration-300'
          }
          group
          touch-none
        `}
        onClick={handleCardClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
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
                  ${isSelected || isLongPressing ? 'brightness-95' : ''}
                `}
                style={{
                  transitionTimingFunction: 'cubic-bezier(0.19, 1, 0.22, 1)'
                }}
                loading="lazy"
                draggable="false"
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