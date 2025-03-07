import React from 'react';
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface TimeSliderProps {
  cookingTime: number;
  setCookingTime: (time: number) => void;
  isGenerating: boolean;
}

export const TimeSlider: React.FC<TimeSliderProps> = ({
  cookingTime,
  setCookingTime,
  isGenerating
}) => {
  return (
    <div className="space-y-4">
      <Label className="font-medium">Cooking Time: {cookingTime} minutes</Label>
      <Slider
        min={10}
        max={120}
        step={5}
        value={[cookingTime]}
        onValueChange={(value) => setCookingTime(value[0])}
        disabled={isGenerating}
      />
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>10 min</span>
        <span>60 min</span>
        <span>120 min</span>
      </div>
    </div>
  );
};