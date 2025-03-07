export const INTERACTION_CONSTANTS = {
  LONG_PRESS_DURATION: 500,
  MOVEMENT_THRESHOLD: 20,
  SCROLL_VELOCITY_THRESHOLD: 0.5,
  SCROLL_RESET_DELAY: 100,
  FAVORITE_ANIMATION_DELAY: 300,
  LONG_PRESS_START_DELAY: 100,
};

export const STYLE_CONSTANTS = {
  BORDER_RADIUS: '24px',
  TRANSITION_DURATION: '300ms',
  TRANSITION_TIMING: 'cubic-bezier(0.19, 1, 0.22, 1)',
  CARD_HEIGHTS: {
    DEFAULT: '280px',
    SM: '300px',
    MD: '320px',
  },
  GRADIENT: {
    HEIGHT: '50%',
    MASK_OPACITY: '60%',
  },
  SCALE: {
    PRESSED: '0.98',
    DEFAULT: '1',
    HOVER: '1.02',
    IMAGE_HOVER: '1.04',
  },
  VERTICAL_THRESHOLD_MULTIPLIER: 2, // Double the threshold for vertical movement
  VELOCITY_TRACKING_POSITIONS: 5, // Number of positions to track for velocity calculation
};

export const ACCESSIBILITY_CONSTANTS = {
  FAVORITE_BUTTON_LABELS: {
    ADD: 'Add to favorites',
    REMOVE: 'Remove from favorites',
  },
}; 