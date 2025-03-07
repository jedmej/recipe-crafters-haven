import { memo, useCallback, useMemo } from "react";
import { Tag } from "@/components/ui/tag";
import { CategoryItemProps } from "./types";

const CategoryItem = memo(
  ({ icon, label, value, variant }: CategoryItemProps) => {
    // Helper function to normalize a single category value
    const normalizeValue = useCallback((val: string): string => {
      // Capitalize first letter of each word
      return val.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }, []);
    
    // Determine the display value based on the input
    const displayContent = useMemo(() => {
      if (!value) {
        return (
          <Tag variant={variant}>
            {variant === 'cooking' ? 'Other' : 'None'}
          </Tag>
        );
      }
      
      if (Array.isArray(value)) {
        if (value.length > 0) {
          return value.map((item, index) => (
            <Tag key={index} variant={variant}>
              {normalizeValue(item)}
            </Tag>
          ));
        }
        return (
          <Tag variant={variant}>
            {variant === 'cooking' ? 'Other' : 'None'}
          </Tag>
        );
      }
      
      return (
        <Tag variant={variant}>
          {normalizeValue(value)}
        </Tag>
      );
    }, [normalizeValue, value, variant]);
    
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
          {icon}
          {label}
        </label>
        <div className="flex flex-wrap gap-2">
          {displayContent}
        </div>
      </div>
    );
  }
);

export default CategoryItem; 