import { Card } from "@/components/ui/card";
import { Database } from "@/integrations/supabase/types";
import { useFavorites } from "@/hooks/use-favorites";
import { useState, useCallback, memo, useMemo, useEffect, useRef, CSSProperties, ReactElement } from "react";
import { FavoriteButton } from "./FavoriteButton";
import { SelectionIndicator } from "./SelectionIndicator";
import { CookTimeIndicator } from "./CookTimeIndicator";
import { useLongPress } from "@/hooks/useLongPress";
import { INTERACTION_CONSTANTS, STYLE_CONSTANTS } from "@/constants/recipe-card";

// Define more specific types
/** Recipe data type from the database */
type Recipe = Database['public']['Tables']['recipes']['Row'];
/** Type for recipe ID strings */
type RecipeId = string;

// Define event types
/** Mouse event type for React elements */
type MouseEventType = React.MouseEvent<HTMLElement>;

/**
 * Props for the RecipeCard component
 */
interface RecipeCardProps {
  /** Recipe data to display */
  recipe: Recipe;
  /** Whether this card is currently selected */
  isSelected: boolean;
  /** Whether the app is in selection mode */
  isSelectionMode: boolean;
  /** Callback for when the card is clicked */
  onClick: (recipeId: RecipeId, event: MouseEventType) => void;
  /** Optional callback for when the card is long-pressed */
  onLongPress?: (recipeId: RecipeId) => void;
}

/**
 * State for the favorite button
 */
type FavoriteButtonState = {
  /** Whether the favorite status is currently being toggled */
  isToggling: boolean;
  /** Whether the user is currently interacting with the favorite button */
  isInteracting: boolean;
};

/**
 * RecipeCard component displays a recipe in a card format with image, title,
 * cook time, and favorite status. It supports selection mode, long press
 * interactions, and favoriting functionality.
 * 
 * The component is optimized for performance with memoization of callbacks,
 * styles, and classnames to prevent unnecessary re-renders.
 */
export const RecipeCard = memo(function RecipeCard({ 
  recipe, 
  isSelected, 
  isSelectionMode, 
  onClick, 
  onLongPress 
}: RecipeCardProps): ReactElement {
  const { isFavorite, toggleFavorite } = useFavorites();
  
  // Memoize the isFavorited value to prevent unnecessary recalculations
  const isFavorited: boolean = useMemo(
    (): boolean => isFavorite(recipe.id), 
    [isFavorite, recipe.id]
  );
  
  // State for tracking favorite button interactions
  const [favoriteButtonState, setFavoriteButtonState] = useState<FavoriteButtonState>({
    isToggling: false,
    isInteracting: false
  });
  
  // Ref to track animation timeout for cleanup
  const animationTimeoutRef = useRef<number | null>(null);
  
  /**
   * Clean up any pending animation timeouts when the component unmounts
   * to prevent memory leaks and state updates on unmounted components
   */
  useEffect((): () => void => {
    return (): void => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
        animationTimeoutRef.current = null;
      }
    };
  }, []);
  
  /**
   * Handler for long press events
   * Only triggers the onLongPress callback if not in selection mode
   */
  const handleLongPress = useCallback((): void => {
    if (onLongPress && !isSelectionMode) {
      onLongPress(recipe.id);
    }
  }, [onLongPress, isSelectionMode, recipe.id]);
  
  // Use the custom hook for long press handling with memoized callback
  const {
    isLongPressing,
    touchTrackingRef,
    handlers
  } = useLongPress({
    onLongPress: handleLongPress
  });

  /**
   * Handler for when the user starts interacting with the favorite button
   * Sets the isInteracting flag to true to prevent card scaling during
   * favorite button interactions
   */
  const handleFavoriteInteractionStart = useCallback((): void => {
    setFavoriteButtonState((prevState: FavoriteButtonState): FavoriteButtonState => ({
      ...prevState,
      isInteracting: true
    }));
  }, []);

  /**
   * Handler for favorite button clicks
   * Toggles the favorite status of the recipe and manages animation states
   * 
   * @param e - Mouse event from the click
   */
  const handleFavoriteClick = useCallback(async (e: MouseEventType): Promise<void> => {
    e.stopPropagation();
    e.preventDefault();
    
    // Prevent multiple clicks while toggling is in progress
    if (favoriteButtonState.isToggling) return;
    
    // Set toggling state to true to show loading state
    setFavoriteButtonState((prevState: FavoriteButtonState): FavoriteButtonState => ({
      ...prevState,
      isToggling: true
    }));
    
    try {
      // Call the API to toggle favorite status
      await toggleFavorite.mutateAsync(recipe.id);
    } catch (error) {
      console.error("Error toggling favorite:", error);
    } finally {
      // Reset toggling state regardless of success/failure
      setFavoriteButtonState((prevState: FavoriteButtonState): FavoriteButtonState => ({
        ...prevState,
        isToggling: false
      }));
      
      // Clear any existing timeout to prevent race conditions
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
      
      // Set a timeout to reset the interaction state after animation completes
      animationTimeoutRef.current = window.setTimeout((): void => {
        setFavoriteButtonState((prevState: FavoriteButtonState): FavoriteButtonState => ({
          ...prevState,
          isInteracting: false
        }));
        animationTimeoutRef.current = null;
      }, INTERACTION_CONSTANTS.FAVORITE_ANIMATION_DELAY);
    }
  }, [favoriteButtonState.isToggling, recipe.id, toggleFavorite]);

  /**
   * Handler for card clicks
   * Manages different behaviors based on selection mode and long press state
   * 
   * @param e - Mouse event from the click
   */
  const handleCardClick = useCallback((e: MouseEventType): void => {
    // Check if the click originated from the favorite button
    const target = e.target as HTMLElement;
    if (target.closest('[data-favorite-button="true"]')) {
      return; // Don't process the click if it came from the favorite button
    }
    
    // For selection mode, always allow clicks regardless of long press state
    if (isSelectionMode) {
      onClick(recipe.id, e);
    } 
    // For normal mode, only handle click if it wasn't a long press and we're not scrolling
    else if (!touchTrackingRef.current.longPressTriggered && !touchTrackingRef.current.isScrolling) {
      onClick(recipe.id, e);
    }
    
    // Reset the long press state after the click is processed
    touchTrackingRef.current.longPressTriggered = false;
  }, [onClick, recipe.id, isSelectionMode, touchTrackingRef]);

  /**
   * Memoized inline styles for the card
   * Handles scaling effects for selection and long press states
   */
  const cardStyle: CSSProperties = useMemo((): CSSProperties => ({
    borderRadius: STYLE_CONSTANTS.BORDER_RADIUS,
    overflow: 'hidden',
    position: 'relative',
    minHeight: STYLE_CONSTANTS.CARD_HEIGHTS.DEFAULT,
    transition: `all ${STYLE_CONSTANTS.TRANSITION_DURATION} ${STYLE_CONSTANTS.TRANSITION_TIMING}`,
    // Scale down the card when selected or long pressing, unless interacting with favorite button
    transform: `scale(${(isSelected || isLongPressing) && !favoriteButtonState.isInteracting 
      ? STYLE_CONSTANTS.SCALE.PRESSED 
      : STYLE_CONSTANTS.SCALE.DEFAULT})`,
    transformOrigin: 'center',
    // Prevent text selection and context menu on touch devices
    WebkitTouchCallout: 'none',
    WebkitUserSelect: 'none',
    KhtmlUserSelect: 'none',
    MozUserSelect: 'none',
    msUserSelect: 'none'
  }), [isSelected, isLongPressing, favoriteButtonState.isInteracting]);

  /**
   * Memoized class names for the card
   * Handles responsive sizing, hover effects, and selection states
   */
  const cardClassName: string = useMemo((): string => `
    cursor-pointer 
    shadow-sm
    hover:shadow-lg
    min-h-[${STYLE_CONSTANTS.CARD_HEIGHTS.DEFAULT}]
    h-[${STYLE_CONSTANTS.CARD_HEIGHTS.DEFAULT}] sm:h-[${STYLE_CONSTANTS.CARD_HEIGHTS.SM}] md:h-[${STYLE_CONSTANTS.CARD_HEIGHTS.MD}]
    rounded-[${STYLE_CONSTANTS.BORDER_RADIUS}]
    transform-gpu
    ${isSelected 
      ? 'ring-2 ring-primary ring-offset-2 ring-offset-background bg-primary/5' 
      : isLongPressing && !favoriteButtonState.isInteracting
        ? 'ring-2 ring-primary/50 ring-offset-2 ring-offset-background'
        : `hover:scale-[${STYLE_CONSTANTS.SCALE.HOVER}] transition-all duration-300`
    }
    group
    select-none
  `, [isSelected, isLongPressing, favoriteButtonState.isInteracting]);

  /**
   * Memoized class names for the recipe image
   * Handles hover effects and selection states
   */
  const imageClassName: string = useMemo((): string => `
    absolute inset-0 w-full h-full object-cover
    transition-all duration-300
    group-hover:scale-[${STYLE_CONSTANTS.SCALE.IMAGE_HOVER}]
    ${(isSelected || isLongPressing) && !favoriteButtonState.isInteracting ? 'brightness-95' : ''}
    select-none
    pointer-events-none
  `, [isSelected, isLongPressing, favoriteButtonState.isInteracting]);

  /**
   * Memoized inline styles for the image
   */
  const imageStyle: CSSProperties = useMemo((): CSSProperties => ({
    transitionTimingFunction: STYLE_CONSTANTS.TRANSITION_TIMING,
    WebkitTouchCallout: 'none'
  }), []);

  return (
    <div className="relative group">
      <Card 
        style={cardStyle}
        className={cardClassName}
        onClick={handleCardClick}
        {...handlers}
      >
        <div className="absolute inset-0 rounded-[24px] overflow-hidden">
          {recipe.image_url ? (
            <>
              <img
                src={recipe.image_url}
                alt={recipe.title}
                className={imageClassName}
                style={imageStyle}
                loading="lazy"
                draggable="false"
                onContextMenu={(e: React.MouseEvent): void => e.preventDefault()}
              />
              {/* Transparent overlay to capture touch events */}
              <div 
                className="absolute inset-0 z-[1]" 
                aria-hidden="true"
              />
              
              {/* Selection indicator */}
              {isSelectionMode && <SelectionIndicator isSelected={isSelected} />}
              
              {/* Favorite button */}
              {!isSelectionMode && (
                <FavoriteButton 
                  isFavorited={isFavorited}
                  isToggling={favoriteButtonState.isToggling}
                  onClick={handleFavoriteClick}
                  onInteractionStart={handleFavoriteInteractionStart}
                />
              )}
              
              {/* Cook time indicator */}
              <CookTimeIndicator cookTime={recipe.cook_time} />
              
              {/* Gradient overlay without blur */}
              <div 
                className="absolute inset-0 z-[2]"
                style={{
                  background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.8) 5%, rgba(0,0,0,0.75) 10%, rgba(0,0,0,0.7) 15%, rgba(0,0,0,0.65) 20%, rgba(0,0,0,0.6) 25%, rgba(0,0,0,0.55) 30%, rgba(0,0,0,0.5) 35%, rgba(0,0,0,0.45) 40%, rgba(0,0,0,0.4) 45%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.3) 55%, rgba(0,0,0,0.25) 60%, rgba(0,0,0,0.2) 65%, rgba(0,0,0,0.15) 70%, rgba(0,0,0,0.1) 75%, rgba(0,0,0,0.075) 80%, rgba(0,0,0,0.05) 85%, rgba(0,0,0,0.025) 90%, rgba(0,0,0,0.01) 95%, rgba(0,0,0,0) 100%)',
                  opacity: 0.8
                }}
              />
              
              {/* Blur effect only for bottom 30% */}
              <div 
                className="absolute inset-x-0 bottom-0 backdrop-blur-[3px] z-[2]" 
                style={{
                  height: '30%',
                  maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.9) 40%, rgba(0,0,0,0.6) 70%, rgba(0,0,0,0) 100%)',
                  WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.9) 40%, rgba(0,0,0,0.6) 70%, rgba(0,0,0,0) 100%)',
                  opacity: 0.95
                }}
              />
            </>
          ) : (
            <div className="absolute inset-0 bg-gray-100" />
          )}
        </div>
        <div className="absolute inset-x-0 bottom-0 p-4 z-[3]">
          <h3 className="font-normal text-[21px] font-['Judson'] line-clamp-2 text-white select-none pointer-events-none drop-shadow-[0_1px_2px_rgba(0,0,0,1)]">
            {recipe.title}
          </h3>
        </div>
      </Card>
    </div>
  );
}); 