import { Heart } from "@phosphor-icons/react";
import { memo, useCallback, useMemo, ReactElement } from "react";
import { ACCESSIBILITY_CONSTANTS, STYLE_CONSTANTS } from "@/constants/recipe-card";

// Define event types
/** Mouse event type for button elements */
type MouseEventType = React.MouseEvent<HTMLButtonElement>;
/** Touch event type for button elements */
type TouchEventType = React.TouchEvent<HTMLButtonElement>;
/** Union type for both mouse and touch events */
type InteractionEventType = MouseEventType | TouchEventType;

/**
 * Props for the FavoriteButton component
 */
interface FavoriteButtonProps {
  /** Whether the recipe is currently favorited */
  isFavorited: boolean;
  /** Whether the favorite status is currently being toggled */
  isToggling: boolean;
  /** Callback for when the button is clicked */
  onClick: (e: MouseEventType) => void;
  /** Callback for when interaction with the button starts */
  onInteractionStart: () => void;
}

/**
 * FavoriteButton component displays a heart icon button that allows users
 * to add or remove a recipe from their favorites.
 * 
 * The component is optimized for performance with memoization of callbacks
 * and styles to prevent unnecessary re-renders.
 */
export const FavoriteButton = memo(function FavoriteButton({
  isFavorited,
  isToggling,
  onClick,
  onInteractionStart
}: FavoriteButtonProps): ReactElement {
  /**
   * Unified handler for both mouse and touch interaction start events
   * Stops event propagation and calls the parent's interaction start handler
   * 
   * @param e - Mouse or touch event
   */
  const handleInteractionStart = useCallback((e: InteractionEventType): void => {
    e.stopPropagation();
    onInteractionStart();
  }, [onInteractionStart]);

  /**
   * Memoized class names for the button
   * Handles visual states for toggling and hover effects
   */
  const buttonClassName: string = useMemo((): string => `
    relative
    bg-[#F5F5F5]
    p-1.5 rounded-full 
    flex items-center justify-center 
    shadow-lg border border-[#F5F5F5]
    transition-all duration-300 ease-in-out
    ${isToggling ? 'opacity-70' : 'hover:bg-[#FA8923]/10 hover:border-[#FA8923]/20 hover:scale-110 hover:shadow-xl'}
  `, [isToggling]);

  /**
   * Memoized class names for the heart icon
   * Changes color based on favorited state
   */
  const heartClassName: string = useMemo((): string => 
    `w-5 h-5 text-[#FA8923] transition-transform duration-300 ease-in-out group-hover:scale-110`, 
    [isFavorited]
  );

  return (
    <div className="absolute top-3 left-3 z-10">
      <button
        onClick={onClick}
        onMouseDown={handleInteractionStart as (e: MouseEventType) => void}
        onTouchStart={handleInteractionStart as (e: TouchEventType) => void}
        disabled={isToggling}
        data-favorite-button="true"
        className={`group ${buttonClassName}`}
        aria-label={isFavorited 
          ? ACCESSIBILITY_CONSTANTS.FAVORITE_BUTTON_LABELS.REMOVE 
          : ACCESSIBILITY_CONSTANTS.FAVORITE_BUTTON_LABELS.ADD}
      >
        <Heart 
          weight={isFavorited ? "fill" : "regular"} 
          className={heartClassName} 
        />
      </button>
    </div>
  );
}); 