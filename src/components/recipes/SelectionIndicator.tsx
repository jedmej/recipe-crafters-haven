import { cn } from "@/lib/utils";
import { memo, useMemo, ReactElement } from "react";

/**
 * Props for the SelectionIndicator component
 */
interface SelectionIndicatorProps {
  /** Whether the parent item is currently selected */
  isSelected: boolean;
}

/**
 * SelectionIndicator component displays a visual indicator for selection state.
 * It shows a checkmark when selected and an empty circle when not selected.
 * 
 * The component is optimized for performance with memoization of styles
 * to prevent unnecessary re-renders.
 */
export const SelectionIndicator = memo(function SelectionIndicator({ 
  isSelected 
}: SelectionIndicatorProps): ReactElement {
  /**
   * Memoized class names for the indicator
   * Changes appearance based on selection state
   */
  const indicatorClassName: string = useMemo((): string => cn(
    "h-5 w-5 rounded-full border-2 transition-colors duration-200",
    isSelected
      ? "bg-primary border-transparent" // Selected state
      : "border-white/80 bg-white/20"   // Unselected state
  ), [isSelected]);

  return (
    <div className="absolute top-3 left-3 bg-white/30 backdrop-blur-md p-1.5 rounded-full flex items-center justify-center shadow-lg border border-white/30 z-10 transition-opacity duration-200">
      <div className={indicatorClassName}>
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
}); 