import { Clock } from "lucide-react";
import { memo, ReactElement } from "react";

/**
 * Props for the CookTimeIndicator component
 */
interface CookTimeIndicatorProps {
  /** Cook time in minutes, or null if not available */
  cookTime: number | null;
}

/**
 * CookTimeIndicator component displays the cooking time for a recipe.
 * It shows a clock icon followed by the time in minutes.
 * 
 * If no cook time is provided, the component returns null and renders nothing.
 */
export const CookTimeIndicator = memo(function CookTimeIndicator({ 
  cookTime 
}: CookTimeIndicatorProps): ReactElement | null {
  // Don't render anything if cook time is not available
  if (!cookTime) return null;
  
  return (
    <div className="absolute top-3 right-3 bg-white/30 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg border border-white/30 z-10">
      <Clock className="w-4 h-4 text-white" />
      <span className="text-sm font-medium text-white drop-shadow-sm">{cookTime} min</span>
    </div>
  );
}); 