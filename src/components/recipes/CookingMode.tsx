import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { X, ArrowLeft, ArrowRight, Timer, ChevronLeft, ChevronRight, Eye, Clock, Plus, Minus } from "lucide-react";
import { RecipeData } from "@/types/recipe";

interface CookingModeProps {
  recipe: RecipeData;
  onClose: () => void;
}

interface TimerState {
  stepIndex: number;
  duration: number; // in seconds
  remaining: number; // in seconds
  isActive: boolean;
  stepText: string; // Store the step text for reference
}

interface TouchPosition {
  startX: number;
  startY: number;
}

export function CookingMode({ recipe, onClose }: CookingModeProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [timer, setTimer] = useState<TimerState | null>(null);
  const [touchPosition, setTouchPosition] = useState<TouchPosition | null>(null);
  const [showNextPreview, setShowNextPreview] = useState(false);
  const [customTimerDuration, setCustomTimerDuration] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Check if current instruction has a time reference
  const currentInstruction = recipe.instructions[currentStep];
  const nextInstruction = currentStep < recipe.instructions.length - 1 
    ? recipe.instructions[currentStep + 1] 
    : null;
  
  // Extract time from instruction text (e.g., "Cook for 5 minutes")
  const extractTimeFromInstruction = useCallback((instruction: string): number | null => {
    const timeRegex = /(\d+)\s*(minute|minutes|min|mins|hour|hours|hr|hrs|second|seconds|sec|secs)/i;
    const match = instruction.match(timeRegex);
    
    if (!match) return null;
    
    const value = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();
    
    if (unit.startsWith('hour') || unit.startsWith('hr')) {
      return value * 60 * 60; // convert hours to seconds
    } else if (unit.startsWith('minute') || unit.startsWith('min')) {
      return value * 60; // convert minutes to seconds
    } else if (unit.startsWith('second') || unit.startsWith('sec')) {
      return value; // already in seconds
    }
    
    return null;
  }, []);
  
  const timeInSeconds = extractTimeFromInstruction(currentInstruction);
  
  // Get the timer duration to display (either custom or extracted)
  const displayTimerDuration = customTimerDuration !== null 
    ? customTimerDuration 
    : timeInSeconds;
  
  // Adjust the timer duration
  const adjustTimerDuration = useCallback((seconds: number) => {
    const baseTime = customTimerDuration !== null 
      ? customTimerDuration 
      : (timeInSeconds || 60); // Default to 60 seconds if no time detected
    
    const newDuration = Math.max(30, baseTime + seconds); // Minimum 30 seconds
    setCustomTimerDuration(newDuration);
  }, [customTimerDuration, timeInSeconds]);
  
  // Format seconds to MM:SS or HH:MM:SS
  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);
  
  // Start a timer for the current step
  const startTimer = useCallback((duration: number) => {
    setTimer({
      stepIndex: currentStep,
      duration,
      remaining: duration,
      isActive: true,
      stepText: recipe.instructions[currentStep]
    });
    setCustomTimerDuration(null); // Reset custom timer duration after starting
  }, [currentStep, recipe.instructions]);
  
  // Handle timer tick
  useEffect(() => {
    if (!timer || !timer.isActive) return;
    
    const interval = setInterval(() => {
      setTimer(prev => {
        if (!prev) return null;
        
        const remaining = prev.remaining - 1;
        
        if (remaining <= 0) {
          // Play sound or notification when timer completes
          const audio = new Audio('/notification.mp3');
          audio.play().catch(e => console.error('Error playing notification sound:', e));
          
          return { ...prev, remaining: 0, isActive: false };
        }
        
        return { ...prev, remaining };
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [timer]);
  
  // Navigate to the next step
  const goToNextStep = useCallback(() => {
    if (currentStep < recipe.instructions.length - 1) {
      setCurrentStep(prev => prev + 1);
      // No longer reset timer when changing steps
    }
  }, [currentStep, recipe.instructions.length]);
  
  // Navigate to the previous step
  const goToPrevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      // No longer reset timer when changing steps
    }
  }, [currentStep]);
  
  // Toggle timer pause/resume
  const toggleTimer = useCallback(() => {
    setTimer(prev => {
      if (!prev) return null;
      return { ...prev, isActive: !prev.isActive };
    });
  }, []);
  
  // Navigate to the timer's step
  const goToTimerStep = useCallback(() => {
    if (timer) {
      setCurrentStep(timer.stepIndex);
    }
  }, [timer]);
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'n') {
        goToNextStep();
      } else if (e.key === 'ArrowLeft' || e.key === 'p' || e.key === 'Backspace') {
        goToPrevStep();
      } else if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 't' && timer) {
        goToTimerStep();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNextStep, goToPrevStep, onClose, goToTimerStep, timer]);
  
  // Handle touch events for swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    const touchDown = e.touches[0];
    setTouchPosition({
      startX: touchDown.clientX,
      startY: touchDown.clientY
    });
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchPosition) return;
    
    const touchDown = e.touches[0];
    const currentX = touchDown.clientX;
    const currentY = touchDown.clientY;
    
    const diffX = touchPosition.startX - currentX;
    const diffY = touchPosition.startY - currentY;
    
    // If horizontal swipe is greater than vertical swipe
    if (Math.abs(diffX) > Math.abs(diffY)) {
      // Swipe right to left (next)
      if (diffX > 50) {
        goToNextStep();
        setTouchPosition(null);
      }
      // Swipe left to right (previous)
      else if (diffX < -50) {
        goToPrevStep();
        setTouchPosition(null);
      }
    }
  };
  
  const handleTouchEnd = () => {
    setTouchPosition(null);
  };
  
  // Toggle next step preview
  const toggleNextPreview = useCallback(() => {
    setShowNextPreview(prev => !prev);
  }, []);
  
  // Determine if we're on the timer's step
  const isOnTimerStep = timer ? currentStep === timer.stepIndex : false;
  
  // Get a shortened version of the timer step text for the preview
  const getShortTimerText = useCallback((text: string): string => {
    if (text.length <= 40) return text;
    return text.substring(0, 37) + '...';
  }, []);
  
  return (
    <div 
      className="fixed inset-0 bg-[#BFCFBC] z-[100] flex flex-col text-white"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div className="p-4 flex justify-between items-center border-b border-white/20 relative">
        {/* Close button on the left */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose}
          className="text-white hover:bg-white/10 z-10"
        >
          <X className="h-6 w-6" />
        </Button>
        
        {/* Centered recipe title */}
        <h2 className="text-xl font-medium absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center w-full max-w-[70%] truncate text-gray-900">
          {recipe.title}
        </h2>
        
        {/* Empty div to balance the layout */}
        <div className="w-10"></div>
      </div>
      
      {/* Step counter and active timer indicator */}
      <div className="p-4 flex flex-col items-center">
        <p className="text-sm text-gray-700 mb-1">
          Step {currentStep + 1} of {recipe.instructions.length}
        </p>
        
        {/* Active timer preview */}
        {timer && timer.isActive && (
          <div 
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
              isOnTimerStep ? 'bg-primary/20' : 'bg-white/20 cursor-pointer hover:bg-white/30'
            } transition-colors`}
            onClick={isOnTimerStep ? undefined : goToTimerStep}
          >
            <Clock className={`h-4 w-4 ${isOnTimerStep ? 'text-primary' : 'text-gray-900'}`} />
            <span className={isOnTimerStep ? 'text-primary' : 'text-gray-900'}>
              {formatTime(timer.remaining)}
            </span>
            {!isOnTimerStep && (
              <span className="text-gray-700 text-xs max-w-[150px] truncate">
                ({getShortTimerText(timer.stepText)})
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* Side navigation buttons */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
        {currentStep > 0 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPrevStep}
            className="h-16 w-16 rounded-full bg-white/20 hover:bg-white/30 text-gray-900"
            aria-label="Previous step"
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
        )}
      </div>
      
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10">
        {currentStep < recipe.instructions.length - 1 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNextStep}
            className="h-16 w-16 rounded-full bg-white/20 hover:bg-white/30 text-gray-900"
            aria-label="Next step"
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        )}
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-auto">
        <div className="max-w-2xl w-full">
          <div className="text-3xl mb-8 text-center text-gray-900">
            {currentInstruction}
          </div>
          
          {/* Timer section - only show if we're on the timer's step or if no timer is active */}
          {(timeInSeconds || customTimerDuration) && (!timer || isOnTimerStep) && (
            <div className="flex flex-col items-center mb-8">
              {isOnTimerStep && timer ? (
                <div className="text-center">
                  <div className="text-5xl font-mono mb-4 text-gray-900">
                    {formatTime(timer.remaining)}
                  </div>
                  <div className="flex gap-4">
                    <Button 
                      onClick={toggleTimer}
                      className="bg-white/20 hover:bg-white/30 text-gray-900"
                    >
                      {timer.isActive ? 'Pause' : 'Resume'}
                    </Button>
                    <Button 
                      onClick={() => setTimer(null)}
                      variant="destructive"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => adjustTimerDuration(-30)}
                      className="h-10 w-10 rounded-full bg-white/20 hover:bg-white/30 text-gray-900"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    
                    <Button 
                      onClick={() => startTimer(displayTimerDuration || 60)}
                      className="flex gap-2 bg-white/20 hover:bg-white/30 px-6 text-gray-900"
                    >
                      <Timer className="h-5 w-5" />
                      Set Timer ({formatTime(displayTimerDuration || 60)})
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => adjustTimerDuration(30)}
                      className="h-10 w-10 rounded-full bg-white/20 hover:bg-white/30 text-gray-900"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {customTimerDuration !== null && timeInSeconds && customTimerDuration !== timeInSeconds && (
                    <div className="text-xs text-gray-700 flex items-center gap-1">
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => setCustomTimerDuration(timeInSeconds)}
                        className="text-xs text-gray-700 h-auto p-0 underline"
                      >
                        Reset to suggested time ({formatTime(timeInSeconds)})
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Next step preview */}
          {nextInstruction && (
            <div className="mt-8">
              <div className="flex items-center justify-center mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleNextPreview}
                  className="text-gray-700 hover:text-gray-900 flex items-center gap-2 text-sm"
                >
                  <Eye className="h-4 w-4" />
                  {showNextPreview ? 'Hide next step' : 'Preview next step'}
                </Button>
              </div>
              
              {showNextPreview && (
                <div className="bg-white/20 p-4 rounded-lg border border-white/30">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-white/20 text-gray-900 text-sm font-medium">
                      {currentStep + 2}
                    </span>
                    <span className="text-gray-700 text-sm font-medium">Next Step</span>
                  </div>
                  <p className="text-gray-900 text-lg">{nextInstruction}</p>
                  
                  {/* Show timer info for next step if applicable */}
                  {extractTimeFromInstruction(nextInstruction) && (
                    <div className="mt-2 flex items-center gap-2 text-gray-700 text-sm">
                      <Timer className="h-3 w-3" />
                      <span>
                        Contains timer: {formatTime(extractTimeFromInstruction(nextInstruction)!)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Bottom navigation */}
      <div className="p-4 flex justify-between border-t border-white/20">
        <Button 
          variant="outline" 
          onClick={goToPrevStep}
          disabled={currentStep === 0}
          className="flex gap-2 bg-transparent border-white/30 text-gray-900 hover:bg-white/20"
        >
          <ArrowLeft className="h-5 w-5" />
          Previous
        </Button>
        
        <div className="flex items-center">
          <span className="text-gray-700 text-sm px-4">
            {currentStep + 1} / {recipe.instructions.length}
          </span>
        </div>
        
        <Button 
          variant="outline" 
          onClick={goToNextStep}
          disabled={currentStep === recipe.instructions.length - 1}
          className="flex gap-2 bg-transparent border-white/30 text-gray-900 hover:bg-white/20"
        >
          Next
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Keyboard shortcuts help */}
      <div className="absolute bottom-20 left-0 right-0 flex justify-center">
        <div className="text-xs text-gray-700 bg-white/10 px-4 py-2 rounded-full">
          Tip: Use arrow keys or swipe to navigate {timer && timer.isActive && "• Press 'T' to jump to timer"}
        </div>
      </div>
    </div>
  );
}