import React from "react";

interface PageLayoutProps {
  children: React.ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="container mx-auto py-8">
      {children}
    </div>
  );
} 