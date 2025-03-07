import { memo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { PortionsInputProps } from "./types";

const PortionsInput = memo(
  ({ 
    portions, 
    onPortionsChange, 
    onSave,
    isSaving
  }: PortionsInputProps) => {
    const handlePortionsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      onPortionsChange(Number(e.target.value));
    }, [onPortionsChange]);

    return (
      <div className="flex items-center justify-start">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min="1"
            value={portions}
            onChange={handlePortionsChange}
            className="w-16"
          />
          <span className="text-sm text-muted-foreground">
            Servings
          </span>
        </div>
      </div>
    );
  }
);

export default PortionsInput; 