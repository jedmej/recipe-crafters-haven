import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CookingPot } from "@phosphor-icons/react";

const cookingPhrases = [
  "Preparing your meal...",
  "Gathering ingredients...",
  "Preheating the oven...",
  "Chopping vegetables...",
  "Measuring spices...",
  "Stirring the pot...",
  "Tasting for seasoning...",
  "Plating with care...",
  "Adding final touches...",
  "Almost ready to serve..."
];

interface RecipeLoadingAnimationProps {
  isVisible: boolean;
}

export function RecipeLoadingAnimation({ isVisible }: RecipeLoadingAnimationProps) {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);

  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setCurrentPhraseIndex((prev) => (prev + 1) % cookingPhrases.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm"
    >
      <div className="flex flex-col items-center space-y-8 p-8 rounded-3xl min-w-[300px]">
        <div className="text-orange-500 flex justify-center">
          <CookingPot size={64} weight="duotone" />
        </div>

        <div className="h-8 relative w-full flex justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={currentPhraseIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="text-xl font-medium text-gray-800 text-center whitespace-nowrap"
            >
              {cookingPhrases[currentPhraseIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
} 