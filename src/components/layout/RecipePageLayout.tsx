import { ReactNode } from "react";
import { BackButton } from "./BackButton";

interface RecipePageLayoutProps {
  children: ReactNode;
  backButtonProps?: {
    onClick?: () => void;
    className?: string;
  };
}

export function RecipePageLayout({ 
  children, 
  backButtonProps 
}: RecipePageLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="flex items-center mb-4 sm:mb-6 lg:mb-8">
          <BackButton {...backButtonProps} />
        </div>

        <div className="w-full max-w-6xl mx-auto space-y-4 sm:space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
} 