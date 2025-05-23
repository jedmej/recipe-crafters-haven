
import React from 'react';
import { Slider } from "@/components/ui/slider";

export interface TimeSliderProps {
  value: number;
  setValue: (value: number) => void;
  title: string;
  icon?: React.ReactNode;
  unit: string;
  max: number;
  step?: number;
}

export const TimeSlider: React.FC<TimeSliderProps> = ({
  value,
  setValue,
  title,
  icon,
  unit,
  max,
  step = 1
}) => {
  const handleChange = (newValue: number[]) => {
    setValue(newValue[0]);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center">
        {icon && <span className="mr-2">{icon}</span>}
        <span className="text-sm font-medium">{title}</span>
      </div>
      <Slider
        value={[value]}
        onValueChange={handleChange}
        max={max}
        step={step}
        className="my-4"
      />
      <div className="flex justify-between text-xs text-gray-500">
        <span>0 {unit}</span>
        <span className="font-medium text-gray-700">{value} {unit}</span>
        <span>{max} {unit}</span>
      </div>
    </div>
  );
};
