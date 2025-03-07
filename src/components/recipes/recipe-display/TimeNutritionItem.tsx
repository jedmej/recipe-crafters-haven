import { memo } from "react";
import { TimeNutritionItemProps } from "./types";

const TimeNutritionItem = memo(
  ({ 
    icon, 
    label, 
    value, 
    originalValue, 
    showOriginal,
    unit = ''
  }: TimeNutritionItemProps) => (
    <div className="glass-panel flex flex-col items-center text-center w-full p-0">
      <div className="p-0">
        {icon}
      </div>
      <div className="flex flex-col items-center p-0">
        <div className="font-medium text-foreground text-sm sm:text-base p-0">{label}</div>
        <div className="text-sm sm:text-base p-0">
          {value} {unit}
          {showOriginal && originalValue && (
            <span className="text-xs sm:text-sm block mt-1 text-muted-foreground p-0">
              (Original: {originalValue} {unit})
            </span>
          )}
        </div>
      </div>
    </div>
  )
);

export default TimeNutritionItem; 