
import React from "react";

export interface SectionDividerProps {
  title: string;
}

export const SectionDivider: React.FC<SectionDividerProps> = ({ title }) => {
  return (
    <div className="flex items-center py-2">
      <div className="flex-grow h-px bg-gray-200"></div>
      <span className="px-4 text-sm font-medium text-gray-500">{title}</span>
      <div className="flex-grow h-px bg-gray-200"></div>
    </div>
  );
};
