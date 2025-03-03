import { Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Database } from "@/integrations/supabase/types";
import { useFavorites } from "@/hooks/use-favorites";
import { Heart } from "@phosphor-icons/react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Recipe = Database['public']['Tables']['recipes']['Row'];

interface RecipeCardProps {
  recipe: Recipe;
  isSelected: boolean;
  isSelectionMode: boolean;
  onClick: (recipeId: string, event: React.MouseEvent) => void;
}

export function RecipeCard({ recipe, isSelected, isSelectionMode, onClick }: RecipeCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const isFavorited = isFavorite(recipe.id);
  const [isToggling, setIsToggling] = useState(false);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isToggling) return; // Prevent multiple clicks
    
    setIsToggling(true);
    setShowHeartAnimation(true);
    
    try {
      await toggleFavorite.mutateAsync(recipe.id);
    } catch (error) {
      console.error("Error toggling favorite:", error);
    } finally {
      setIsToggling(false);
      // Reset animation state after a delay
      setTimeout(() => setShowHeartAnimation(false), 1000);
    }
  };

  // Heart animation variants
  const heartVariants = {
    initial: { scale: 1 },
    animate: { 
      scale: [1, 1.5, 1],
      transition: { 
        duration: 0.5,
        times: [0, 0.3, 1],
        ease: "easeInOut" 
      }
    }
  };

  // Pulse animation variants
  const pulseVariants = {
    initial: { 
      scale: 0.8,
      opacity: 0.7,
    },
    animate: { 
      scale: 1.8,
      opacity: 0,
      transition: { 
        duration: 0.8,
        ease: "easeOut" 
      }
    }
  };

  return (
    <motion.div 
      className="relative group"
      layout
      layoutId={`recipe-${recipe.id}`}
    >
      <Card 
        style={{
          borderRadius: '24px',
          overflow: 'hidden',
          position: 'relative',
          transition: 'all 300ms cubic-bezier(0.19, 1, 0.22, 1)',
          transform: `scale(${isSelected ? '0.98' : '1'})`,
          transformOrigin: 'center'
        }}
        className={`
          cursor-pointer 
          shadow-sm
          hover:shadow-lg
          h-[280px] sm:h-[300px] md:h-[320px]
          rounded-[24px]
          transform-gpu
          ${isSelected 
            ? 'ring-2 ring-primary ring-offset-2 ring-offset-background bg-primary/5' 
            : 'hover:scale-[1.02] transition-all duration-300'
          }
          group
        `}
        onClick={(e) => onClick(recipe.id, e)}
      >
        <motion.div 
          className="absolute inset-0 rounded-[24px] overflow-hidden"
          layoutId={`recipe-image-${recipe.id}`}
        >
          {recipe.image_url ? (
            <>
              <motion.img
                src={recipe.image_url}
                alt={recipe.title}
                className={`
                  absolute inset-0 w-full h-full object-cover
                  transition-all duration-300
                  group-hover:scale-[1.04]
                  ${isSelected ? 'brightness-95' : ''}
                `}
                style={{
                  transitionTimingFunction: 'cubic-bezier(0.19, 1, 0.22, 1)'
                }}
                layoutId={`recipe-image-content-${recipe.id}`}
              />
              {isSelectionMode && (
                <div className="absolute top-3 left-3 bg-white/30 backdrop-blur-md p-1.5 rounded-full flex items-center justify-center shadow-lg border border-white/30 z-10 transition-opacity duration-200">
                  <div className={cn(
                    "h-5 w-5 rounded-full border-2 transition-colors duration-200",
                    isSelected
                      ? "bg-primary border-transparent"
                      : "border-white/80 bg-white/20"
                  )}>
                    {isSelected && (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-full w-full p-1"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                </div>
              )}
              {!isSelectionMode && (
                <div className="absolute top-3 left-3 z-10">
                  <motion.button
                    onClick={handleFavoriteClick}
                    disabled={isToggling}
                    className={`
                      relative
                      bg-white/30 backdrop-blur-md 
                      p-1.5 rounded-full 
                      flex items-center justify-center 
                      shadow-lg border border-white/30 
                      transition-all duration-200 
                      ${isToggling ? 'opacity-70' : 'hover:scale-110'}
                    `}
                    aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    initial={false}
                  >
                    <motion.div
                      variants={heartVariants}
                      initial="initial"
                      animate={showHeartAnimation ? "animate" : "initial"}
                    >
                      <Heart 
                        weight={isFavorited ? "duotone" : "regular"} 
                        className={`w-5 h-5 ${isFavorited ? 'text-red-500' : 'text-white'}`} 
                      />
                    </motion.div>
                    
                    {/* Pulse effect when favoriting */}
                    <AnimatePresence>
                      {showHeartAnimation && isFavorited && (
                        <motion.div 
                          className="absolute inset-0 rounded-full bg-red-500"
                          variants={pulseVariants}
                          initial="initial"
                          animate="animate"
                          exit={{ opacity: 0 }}
                        />
                      )}
                    </AnimatePresence>
                  </motion.button>
                  
                  {/* Floating hearts animation when favoriting */}
                  <AnimatePresence>
                    {showHeartAnimation && isFavorited && (
                      <>
                        {[...Array(3)].map((_, i) => (
                          <motion.div 
                            key={i}
                            className="absolute left-1/2 top-1/2 z-20"
                            initial={{ 
                              x: 0, 
                              y: 0, 
                              scale: 0.5, 
                              opacity: 0.9 
                            }}
                            animate={{ 
                              x: Math.random() * 40 - 20, 
                              y: -30 - Math.random() * 20,
                              scale: 0,
                              opacity: 0
                            }}
                            transition={{ 
                              duration: 1 + Math.random() * 0.5,
                              delay: i * 0.1,
                              ease: "easeOut" 
                            }}
                            exit={{ opacity: 0 }}
                          >
                            <Heart weight="fill" className="text-red-500 w-4 h-4" />
                          </motion.div>
                        ))}
                      </>
                    )}
                  </AnimatePresence>
                </div>
              )}
              {recipe.cook_time && (
                <motion.div 
                  className="absolute top-3 right-3 bg-white/30 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg border border-white/30 z-10"
                  layoutId={`recipe-time-${recipe.id}`}
                >
                  <Clock className="w-4 h-4 text-white" />
                  <span className="text-sm font-medium text-white drop-shadow-sm">{recipe.cook_time} min</span>
                </motion.div>
              )}
              <motion.div 
                className="absolute inset-x-0 bottom-0 h-[50%]"
                layoutId={`recipe-gradient-${recipe.id}`}
              >
                <div 
                  className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
                />
                <div 
                  className="absolute inset-0 backdrop-blur-[5px]"
                  style={{ 
                    maskImage: 'linear-gradient(to top, black 60%, transparent)',
                    WebkitMaskImage: 'linear-gradient(to top, black 60%, transparent)'
                  }}
                />
              </motion.div>
            </>
          ) : (
            <div className="absolute inset-0 bg-gray-100" />
          )}
        </motion.div>
        <motion.div 
          className="absolute inset-x-0 bottom-0 p-4"
          layoutId={`recipe-title-${recipe.id}`}
        >
          <motion.h3 
            className="font-normal text-[21px] font-['Judson'] line-clamp-2 text-white"
            layoutId={`recipe-title-text-${recipe.id}`}
          >
            {recipe.title}
          </motion.h3>
          {false && recipe.description && (
            <p className="mt-2 text-sm line-clamp-2 text-white/80">
              {recipe.description}
            </p>
          )}
        </motion.div>
      </Card>
    </motion.div>
  );
} 