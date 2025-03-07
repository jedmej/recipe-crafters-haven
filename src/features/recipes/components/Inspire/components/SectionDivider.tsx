import React from 'react';

export const SectionDivider: React.FC = () => (
  <div className="relative my-8">
    <div className="absolute inset-0 flex items-center">
      <span className="w-full border-t" />
    </div>
    <div className="relative flex justify-center text-xs uppercase">
      <span className="bg-gray-50 px-2 text-muted-foreground">or let us inspire you</span>
    </div>
  </div>
);