import { Button } from "@/components/ui/button";
import { CaretLeft, Heart, PencilSimple, SpinnerGap, Trash, FloppyDisk } from "@phosphor-icons/react";
import { memo, useCallback, useReducer } from "react";
import { useFavorites } from "@/hooks/use-favorites";
import { useToast } from "@/hooks/use-toast";
import { ActionButtonsAction, ActionButtonsState, RecipeDisplayProps } from "./types";
import { AsyncHandler, SyncHandler, handleError } from "./utils";

// Constants
const PRIMARY_BUTTON_CLASSES = "flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-4 py-2 rounded-full";

const actionButtonsReducer = (state: ActionButtonsState, action: ActionButtonsAction): ActionButtonsState => {
  switch (action.type) {
    case 'START_FAVORITE_TOGGLE':
      return { ...state, isToggling: true, error: null };
    case 'FAVORITE_TOGGLE_SUCCESS':
      return { ...state, isToggling: false, error: null };
    case 'FAVORITE_TOGGLE_ERROR':
      return { ...state, isToggling: false, error: action.payload };
    default:
      return state;
  }
};

const ActionButtons = memo(({ 
  recipe, 
  onEditOrGenerate, 
  onSave, 
  isSaving,
  onBack
}: Pick<RecipeDisplayProps, 'recipe' | 'onEditOrGenerate' | 'onSave' | 'isSaving' | 'onBack'>) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { toast } = useToast();
  const [favoriteState, dispatch] = useReducer(actionButtonsReducer, {
    isToggling: false,
    error: null
  });
  const isFavorited = recipe.id ? isFavorite(recipe.id) : false;

  const handleBackClick: SyncHandler<[React.MouseEvent]> = useCallback((e) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    onBack();
  }, [onBack]);

  const handleFavoriteToggle: AsyncHandler<[string]> = useCallback(async (recipeId) => {
    await toggleFavorite.mutateAsync(recipeId);
  }, [toggleFavorite]);

  const handleFavoriteClick: SyncHandler<[React.MouseEvent]> = useCallback((e) => {
    e.stopPropagation();
    
    if (!recipe.id || favoriteState.isToggling) return; // Prevent if no recipe id or already toggling
    
    dispatch({ type: 'START_FAVORITE_TOGGLE' });
    
    handleFavoriteToggle(recipe.id)
      .then(() => {
        dispatch({ type: 'FAVORITE_TOGGLE_SUCCESS' });
      })
      .catch((error) => {
        handleError(error, {
          toast,
          title: "Error",
          description: "Failed to update favorite status. Please try again."
        });
        dispatch({ type: 'FAVORITE_TOGGLE_ERROR', payload: error instanceof Error ? error : new Error(String(error)) });
      });
  }, [recipe.id, favoriteState.isToggling, handleFavoriteToggle, toast]);

  return (
    <div className="absolute top-0 left-0 right-0 py-4 px-4 flex justify-between items-center z-[60]">
      <button
        onClick={handleBackClick}
        className="h-12 w-12 rounded-full bg-[#F5F5F5] hover:bg-gray-200 flex items-center justify-center transition-colors shadow-sm"
        aria-label="Go Back"
      >
        <CaretLeft weight="duotone" size={20} className="text-gray-700" />
      </button>
      <div className="flex gap-2">
        <button
          onClick={handleFavoriteClick}
          disabled={!recipe.id || favoriteState.isToggling}
          className="group relative h-12 w-12 rounded-full bg-[#F5F5F5] hover:bg-[#FA8923]/10 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-300 ease-in-out hover:shadow-xl"
          aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart 
            weight={isFavorited ? "duotone" : "regular"}
            size={20}
            className="text-[#FA8923] transition-transform duration-300 ease-in-out group-hover:scale-110"
          />
        </button>
        <button
          onClick={onEditOrGenerate}
          className="h-12 w-12 rounded-full bg-[#F5F5F5] hover:bg-gray-200 flex items-center justify-center transition-colors"
          aria-label={recipe.id ? "Edit Recipe" : "Generate New"}
        >
          <PencilSimple weight="duotone" size={20} className="text-gray-700" />
        </button>
        {recipe.id ? (
          <Button
            onClick={onSave}
            disabled={isSaving}
            className="h-12 w-12 rounded-full bg-[#F5F5F5] hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
            aria-label="Delete Recipe"
          >
            {isSaving ? (
              <SpinnerGap size={20} className="text-gray-700 animate-spin" />
            ) : (
              <Trash weight="duotone" size={20} className="text-gray-700" />
            )}
          </Button>
        ) : (
          <Button
            onClick={onSave}
            disabled={isSaving}
            className={`${PRIMARY_BUTTON_CLASSES} w-[200px]`}
            aria-label="Save Recipe"
          >
            {isSaving ? (
              <>
                <SpinnerGap weight="bold" size={16} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <FloppyDisk weight="bold" size={16} />
                <span>Save</span>
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
});

export default ActionButtons; 