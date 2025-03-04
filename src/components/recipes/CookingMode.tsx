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
      className="fixed inset-0 bg-[#E4E7DF] z-[100] flex flex-col text-black"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header with recipe title and back button */}
      <div className="p-16 flex justify-between items-center">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose}
          className="h-12 w-12 rounded-full bg-white hover:bg-white/90"
        >
          <X className="h-5 w-5" />
        </Button>
        
        <h2 className="text-2xl font-serif">
          {recipe.title}
        </h2>
        
        {/* Empty div to balance the layout */}
        <div className="w-12"></div>
      </div>
      
      {/* Active timer badge - moved under recipe title */}
      {timer && timer.isActive && !isOnTimerStep && (
        <div className="w-full flex justify-center -mt-8 mb-4">
          <div 
            className="flex items-center gap-2 px-4 py-2 rounded-full text-base bg-[#FA8922] text-white cursor-pointer hover:bg-[#FA8922]/90 shadow-sm transition-all duration-300 ease-in-out"
            onClick={goToTimerStep}
          >
            <Clock className="h-5 w-5 text-white" />
            <span className="font-medium">{formatTime(timer.remaining)}</span>
          </div>
        </div>
      )}
      
      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-between px-16 py-12">
        {/* Step counter pill */}
        <div className="flex flex-col items-center gap-[48px]">
          <div className="bg-[#F5F5F5]/50 px-4 py-2 rounded-full">
            <p className="text-base font-semibold">
              Step {currentStep + 1} of {recipe.instructions.length}
            </p>
          </div>
          
          {/* Instruction text */}
          <div className="text-5xl font-serif leading-tight text-center max-w-3xl">
            {currentInstruction}
          </div>
          
          {/* Timer section - moved above preview next step */}
          {(timeInSeconds || customTimerDuration) && (!timer || isOnTimerStep) && (
            <div className="flex flex-col items-center">
              {isOnTimerStep && timer ? (
                <div className="text-center">
                  <div className="text-5xl font-archivo mb-4">
                    {formatTime(timer.remaining)}
                  </div>
                  <div className="flex gap-4">
                    <Button 
                      onClick={toggleTimer}
                      className="bg-[#FA8922] hover:bg-[#FA8922]/90 text-white px-6 rounded-full transition-all duration-300 ease-in-out"
                    >
                      {timer.isActive ? 'Pause' : 'Resume'}
                    </Button>
                    <Button 
                      onClick={() => setTimer(null)}
                      className="bg-white border border-gray-300 hover:bg-gray-100 text-black px-6 rounded-full transition-all duration-300 ease-in-out"
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
                      className="h-10 w-10 rounded-full bg-[#F5F5F5] hover:bg-[#F5F5F5]/80"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    
                    <Button 
                      onClick={() => startTimer(displayTimerDuration || 60)}
                      className="flex gap-2 bg-[#FA8922] hover:bg-[#FA8922]/90 text-white px-6 rounded-full transition-all duration-300 ease-in-out"
                    >
                      <Timer className="h-5 w-5" />
                      Set Timer ({formatTime(displayTimerDuration || 60)})
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => adjustTimerDuration(30)}
                      className="h-10 w-10 rounded-full bg-[#F5F5F5] hover:bg-[#F5F5F5]/80"
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
        </div>
        
        {/* Bottom spacing - empty div to maintain layout */}
        <div className="w-full h-[48px]"></div>
      </div>
      
      {/* Corner navigation buttons that look like they're going off screen */}
      <div className="absolute left-0 bottom-0">
        <Button 
          variant="outline" 
          onClick={goToPrevStep}
          disabled={currentStep === 0}
          className="w-[500px] h-[500px] bg-[#F5F5F5] hover:bg-[#F5F5F5]/90 border-none rounded-full flex flex-col items-center justify-center gap-4 text-3xl -translate-x-[30%] translate-y-[30%] transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg group disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none"
        >
          <div className="translate-x-[30%] -translate-y-[30%] flex flex-col items-center transition-all duration-300 ease-in-out group-hover:translate-y-[-32%]">
            <ChevronLeft className="h-20 w-20 transition-transform duration-300 ease-in-out group-hover:scale-110" />
            <span className="font-bold transition-all duration-300 ease-in-out group-hover:scale-110">Previous</span>
          </div>
        </Button>
      </div>
      
      {/* Preview next step button positioned in the center bottom */}
      {nextInstruction && (
        <div className={`absolute bottom-[80px] left-1/2 -translate-x-1/2 ${showNextPreview ? 'translate-y-0' : 'translate-y-0'} transition-all duration-500 ease-in-out z-20`}>
          {showNextPreview ? (
            <div 
              className="bg-white p-7 rounded-[32px] shadow-lg max-w-md w-[350px] transform origin-bottom transition-all duration-500 ease-in-out animate-scale-in border border-gray-100"
              style={{ transformOrigin: 'center bottom' }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-archivo font-semibold text-lg text-[#333333]">Next Step</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleNextPreview}
                  className="h-8 w-8 rounded-full p-0 hover:bg-[#F5F5F5] transition-colors duration-200"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-base font-archivo leading-relaxed text-[#333333]">{nextInstruction}</p>
              
              {/* Show timer info for next step if applicable */}
              {extractTimeFromInstruction(nextInstruction) && (
                <div className="mt-4 flex items-center gap-2 bg-[#F5F5F5] p-3 rounded-xl text-[#333333]">
                  <Timer className="h-4 w-4 text-[#FA8922]" />
                  <span className="font-archivo text-sm">
                    Contains timer: <span className="font-semibold">{formatTime(extractTimeFromInstruction(nextInstruction)!)}</span>
                  </span>
                </div>
              )}
            </div>
          ) : (
            <Button
              variant="ghost"
              onClick={toggleNextPreview}
              className="bg-white hover:bg-white/90 text-[#333333] rounded-full px-6 py-3 h-auto shadow-md transform transition-all duration-500 ease-in-out animate-scale-in flex items-center font-archivo border border-gray-100"
            >
              <Eye className="h-5 w-5 mr-2 text-[#FA8922]" />
              Preview next step
            </Button>
          )}
        </div>
      )}
      
      <div className="absolute right-0 bottom-0">
        <Button 
          variant="outline" 
          onClick={goToNextStep}
          disabled={currentStep === recipe.instructions.length - 1}
          className="w-[500px] h-[500px] bg-[#F5F5F5] hover:bg-[#F5F5F5]/90 border-none rounded-full flex flex-col items-center justify-center gap-4 text-3xl translate-x-[30%] translate-y-[30%] transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg group disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none"
        >
          <div className="-translate-x-[30%] -translate-y-[30%] flex flex-col items-center transition-all duration-300 ease-in-out group-hover:translate-y-[-32%]">
            <ChevronRight className="h-20 w-20 transition-transform duration-300 ease-in-out group-hover:scale-110" />
            <span className="font-bold transition-all duration-300 ease-in-out group-hover:scale-110">Next</span>
          </div>
        </Button>
      </div>
      
      {/* Add keyframes for the morphing animation */}
      <style jsx global>{`
        @keyframes scale-in {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}