import { memo } from "react";
import { MeasurementToggleProps } from "./types";

const MeasurementToggle = memo(
  ({ 
    measurementSystem, 
    onMeasurementSystemChange 
  }: MeasurementToggleProps) => (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">Metric</span>
      <button
        onClick={onMeasurementSystemChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          measurementSystem === 'imperial' ? 'bg-primary' : 'bg-gray-200'
        }`}
        role="switch"
        aria-checked={measurementSystem === 'imperial'}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            measurementSystem === 'imperial' ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      <span className="text-sm font-medium">Imperial</span>
    </div>
  )
);

export default MeasurementToggle;

 