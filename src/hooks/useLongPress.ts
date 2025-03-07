import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { INTERACTION_CONSTANTS, STYLE_CONSTANTS } from '@/constants/recipe-card';

// Define event types more precisely
/** Touch event type for HTML elements */
type TouchEventType = React.TouchEvent<HTMLElement>;
/** Mouse event type for HTML elements */
type MouseEventType = React.MouseEvent<HTMLElement>;
/** Union type for both mouse and touch events */
type InteractionEventType = TouchEventType | MouseEventType;

/**
 * Return type for the useLongPress hook
 */
export interface UseLongPressResult {
  /** Whether a long press is currently active */
  isLongPressing: boolean;
  /** Reference to the internal tracking state, exposed for advanced use cases */
  touchTrackingRef: React.RefObject<TouchTrackingState>;
  /** Event handlers to attach to the target element */
  handlers: LongPressHandlers;
}

/**
 * Event handlers that should be spread onto the target element
 */
export interface LongPressHandlers {
  onMouseDown: (e: MouseEventType) => void;
  onTouchStart: (e: TouchEventType) => void;
  onMouseMove: (e: MouseEventType) => void;
  onTouchMove: (e: TouchEventType) => void;
  onMouseUp: (e: MouseEventType) => void;
  onMouseLeave: (e: MouseEventType) => void;
  onTouchEnd: (e: TouchEventType) => void;
  onTouchCancel: (e: TouchEventType) => void;
}

/**
 * Configuration options for the useLongPress hook
 */
export interface UseLongPressOptions {
  /** Callback function to execute when a long press is detected */
  onLongPress: () => void;
  /** Optional callback function to execute when a long press is canceled */
  onCancel?: () => void;
  /** Duration in milliseconds before a press is considered "long" */
  duration?: number;
  /** Threshold in pixels for movement before canceling a long press */
  movementThreshold?: number;
  /** Threshold for velocity (px/ms) before considering movement as scrolling */
  scrollVelocityThreshold?: number;
}

/**
 * Basic position interface with x and y coordinates
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Position with a timestamp, used for velocity calculations
 */
export interface PositionWithTime extends Position {
  time: number;
}

/**
 * Internal state for tracking touch/mouse interactions
 */
export interface TouchTrackingState {
  /** Initial position where the interaction started */
  startPosition: Position;
  /** Most recent position of the interaction */
  lastPosition: Position;
  /** Whether the user is currently scrolling */
  isScrolling: boolean;
  /** Whether a long press has been triggered */
  longPressTriggered: boolean;
  /** ID of the timeout that will trigger the long press */
  longPressTimeout: number | null;
  /** Data for tracking movement velocity */
  velocityTracking: {
    /** Array of recent positions with timestamps */
    positions: Array<PositionWithTime>;
    /** Timestamp of the last update */
    lastUpdate: number;
  };
}

/** Type for cleanup functions returned by some callbacks */
type CleanupFunction = () => void;

/**
 * Custom hook for detecting long press gestures on both touch and mouse interfaces.
 * 
 * This hook provides a unified API for handling long press interactions across different
 * input methods. It includes sophisticated detection of scrolling vs. pressing,
 * movement thresholds, and proper cleanup to prevent memory leaks.
 * 
 * @param options - Configuration options for the long press behavior
 * @returns Object containing the current state and handlers to attach to the target element
 * 
 * @example
 * ```tsx
 * const { isLongPressing, handlers } = useLongPress({
 *   onLongPress: () => console.log('Long press detected!'),
 *   duration: 500 // 500ms = 0.5 seconds
 * });
 * 
 * return (
 *   <div 
 *     className={isLongPressing ? 'active' : ''}
 *     {...handlers}
 *   >
 *     Press and hold me
 *   </div>
 * );
 * ```
 */
export function useLongPress({
  onLongPress,
  onCancel,
  duration = INTERACTION_CONSTANTS.LONG_PRESS_DURATION,
  movementThreshold = INTERACTION_CONSTANTS.MOVEMENT_THRESHOLD,
  scrollVelocityThreshold = INTERACTION_CONSTANTS.SCROLL_VELOCITY_THRESHOLD
}: UseLongPressOptions): UseLongPressResult {
  const [isLongPressing, setIsLongPressing] = useState<boolean>(false);
  
  // Consolidate all tracking refs into a single ref object for better performance
  const touchTrackingRef = useRef<TouchTrackingState>({
    startPosition: { x: 0, y: 0 },
    lastPosition: { x: 0, y: 0 },
    isScrolling: false,
    longPressTriggered: false,
    longPressTimeout: null,
    velocityTracking: {
      positions: [],
      lastUpdate: 0
    }
  });

  /**
   * Cancels any pending long press and resets the state.
   * This is called when movement exceeds thresholds or when
   * the interaction ends.
   */
  const cancelLongPress = useCallback((): void => {
    // Clear the timeout to prevent the long press from triggering
    if (touchTrackingRef.current.longPressTimeout) {
      window.clearTimeout(touchTrackingRef.current.longPressTimeout);
      touchTrackingRef.current.longPressTimeout = null;
    }
    setIsLongPressing(false);
    
    // Only call onCancel if a long press was actually triggered
    if (onCancel && touchTrackingRef.current.longPressTriggered) {
      onCancel();
    }
  }, [onCancel]);

  // Consolidated effect for cleanup and scroll tracking
  useEffect((): CleanupFunction => {
    let scrollTimeout: number | null = null;
    
    /**
     * Handles document scroll events.
     * When the user scrolls, we need to cancel any pending long press
     * and mark the state as scrolling to prevent new long presses.
     */
    const handleScroll = (): void => {
      // User is scrolling, cancel any pending long press
      touchTrackingRef.current.isScrolling = true;
      cancelLongPress();
      
      // Reset the scrolling flag after scrolling stops
      if (scrollTimeout) {
        window.clearTimeout(scrollTimeout);
      }
      
      scrollTimeout = window.setTimeout(() => {
        touchTrackingRef.current.isScrolling = false;
      }, INTERACTION_CONSTANTS.SCROLL_RESET_DELAY);
    };
    
    // Add scroll event listener with passive flag for better performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Cleanup function that handles both scroll listener and timeouts
    return (): void => {
      // Remove scroll event listener
      window.removeEventListener('scroll', handleScroll);
      
      // Clear scroll timeout if it exists
      if (scrollTimeout) {
        window.clearTimeout(scrollTimeout);
        scrollTimeout = null;
      }
      
      // Clear long press timeout if it exists
      if (touchTrackingRef.current.longPressTimeout) {
        window.clearTimeout(touchTrackingRef.current.longPressTimeout);
        touchTrackingRef.current.longPressTimeout = null;
      }
    };
  }, [cancelLongPress]); // Add cancelLongPress as a dependency

  /**
   * Checks if the user has moved beyond the movement threshold.
   * Movement is checked against both horizontal and vertical thresholds,
   * with vertical movement having a higher threshold to accommodate
   * natural hand movement during pressing.
   * 
   * @param clientX - Current X coordinate
   * @param clientY - Current Y coordinate
   * @returns true if movement exceeded thresholds, false otherwise
   */
  const checkMovement = useCallback((clientX: number, clientY: number): boolean => {
    const { startPosition } = touchTrackingRef.current;
    const deltaX: number = Math.abs(clientX - startPosition.x);
    const deltaY: number = Math.abs(clientY - startPosition.y);
    
    // Be more lenient with vertical movement (scrolling) than horizontal movement
    const horizontalThreshold: number = movementThreshold;
    const verticalThreshold: number = movementThreshold * STYLE_CONSTANTS.VERTICAL_THRESHOLD_MULTIPLIER;
    
    // If the user moved too much horizontally or significantly vertically, cancel the long press
    if (deltaX > horizontalThreshold || deltaY > verticalThreshold) {
      cancelLongPress();
      return true;
    }
    return false;
  }, [cancelLongPress, movementThreshold]);

  /**
   * Tracks movement and calculates velocity to distinguish between
   * intentional movement and scrolling.
   * 
   * @param clientX - Current X coordinate
   * @param clientY - Current Y coordinate
   * @returns true if movement exceeded thresholds, false otherwise
   */
  const trackMovement = useCallback((clientX: number, clientY: number): boolean => {
    const now: number = Date.now();
    const trackingState = touchTrackingRef.current;
    
    trackingState.lastPosition = { x: clientX, y: clientY };
    
    // Add current position to tracking array for velocity calculation
    trackingState.velocityTracking.positions.push({
      x: clientX,
      y: clientY,
      time: now
    });
    
    // Keep only the last N positions for velocity calculation to limit memory usage
    if (trackingState.velocityTracking.positions.length > STYLE_CONSTANTS.VELOCITY_TRACKING_POSITIONS) {
      trackingState.velocityTracking.positions.shift();
    }
    
    trackingState.velocityTracking.lastUpdate = now;
    
    // Calculate velocity based on the tracked positions
    if (trackingState.velocityTracking.positions.length >= 2) {
      const positions = trackingState.velocityTracking.positions;
      const newest = positions[positions.length - 1];
      const oldest = positions[0];
      
      const dx: number = newest.x - oldest.x;
      const dy: number = newest.y - oldest.y;
      const dt: number = newest.time - oldest.time;
      
      if (dt > 0) {
        // Calculate velocity in pixels per millisecond
        const velocityX: number = Math.abs(dx) / dt;
        const velocityY: number = Math.abs(dy) / dt;
        
        // Calculate total velocity using Pythagorean theorem
        const velocity: number = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
        
        // If velocity exceeds threshold, user is scrolling or swiping, not long pressing
        if (velocity > scrollVelocityThreshold) {
          touchTrackingRef.current.isScrolling = true;
          cancelLongPress();
        }
      }
    }
    
    return checkMovement(clientX, clientY);
  }, [cancelLongPress, checkMovement, scrollVelocityThreshold]);

  /**
   * Initiates the long press detection process.
   * Sets up timers and state for tracking the press duration.
   * 
   * @param clientX - Starting X coordinate
   * @param clientY - Starting Y coordinate
   * @returns Cleanup function to cancel timers if component unmounts
   */
  const startLongPress = useCallback((clientX: number, clientY: number): CleanupFunction => {
    const trackingState = touchTrackingRef.current;
    
    // Store the starting position for movement calculations
    trackingState.startPosition = { x: clientX, y: clientY };
    trackingState.lastPosition = { x: clientX, y: clientY };
    
    // Reset tracking state for a new interaction
    trackingState.isScrolling = false;
    trackingState.velocityTracking.positions = [];
    trackingState.velocityTracking.lastUpdate = Date.now();
    
    // Reset the long press state
    trackingState.longPressTriggered = false;
    
    // Clear any existing timeout from previous interactions
    if (trackingState.longPressTimeout) {
      window.clearTimeout(trackingState.longPressTimeout);
      trackingState.longPressTimeout = null;
    }
    
    // Create a local variable to track the delay timeout
    let delayTimeout: number | null = null;
    
    // Add a small delay before starting the long press timer
    // This helps distinguish between scrolling and long press
    delayTimeout = window.setTimeout(() => {
      delayTimeout = null;
      
      // Only start the long press timer if we're not scrolling
      if (!trackingState.isScrolling) {
        trackingState.longPressTimeout = window.setTimeout(() => {
          // Double-check that we're still not scrolling before triggering
          if (!trackingState.isScrolling) {
            setIsLongPressing(true);
            trackingState.longPressTriggered = true;
            onLongPress();
          }
        }, duration);
      }
    }, INTERACTION_CONSTANTS.LONG_PRESS_START_DELAY);
    
    // Return a cleanup function that can be used to clear the delay timeout
    return (): void => {
      if (delayTimeout) {
        window.clearTimeout(delayTimeout);
        delayTimeout = null;
      }
    };
  }, [duration, onLongPress]);

  /**
   * Unified handler for both mouse and touch interaction start events.
   * Extracts coordinates and initiates the long press process.
   * 
   * @param e - Mouse or touch event
   */
  const handleInteractionStart = useCallback((e: InteractionEventType): void => {
    let clientX: number;
    let clientY: number;
    
    // Extract coordinates based on event type
    if ('touches' in e) {
      // Touch event
      if (e.touches.length !== 1) return; // Only handle single touch
      
      const touch = e.touches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      // Mouse event
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    // Don't start long press if already scrolling
    if (!touchTrackingRef.current.isScrolling) {
      startLongPress(clientX, clientY);
    }
  }, [startLongPress]);

  /**
   * Unified handler for both mouse and touch movement events.
   * Tracks movement to determine if the long press should be canceled.
   * 
   * @param e - Mouse or touch event
   */
  const handleInteractionMove = useCallback((e: InteractionEventType): void => {
    if (!touchTrackingRef.current.longPressTimeout) return;
    
    let clientX: number;
    let clientY: number;
    
    // Extract coordinates based on event type
    if ('touches' in e) {
      // Touch event
      if (e.touches.length !== 1) return; // Only handle single touch
      
      const touch = e.touches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      // Mouse event
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const moved = trackMovement(clientX, clientY);
    
    // If significant movement detected, mark as scrolling
    if (moved) {
      touchTrackingRef.current.isScrolling = true;
      cancelLongPress();
    }
  }, [trackMovement, cancelLongPress]);

  /**
   * Unified handler for both mouse and touch end events.
   * Cancels the long press and resets state.
   * 
   * @param e - Optional mouse or touch event
   * @returns Cleanup function to clear timeouts
   */
  const handleInteractionEnd = useCallback((e?: InteractionEventType): CleanupFunction => {
    // For touch events, prevent default if we're in long press mode
    if (e && 'touches' in e && touchTrackingRef.current.longPressTriggered) {
      e.preventDefault();
    }
    
    // Use a local variable to track the reset timeout
    let resetTimeout: number | null = null;
    
    // Reset scrolling state after a short delay
    resetTimeout = window.setTimeout(() => {
      resetTimeout = null;
      touchTrackingRef.current.isScrolling = false;
    }, INTERACTION_CONSTANTS.SCROLL_RESET_DELAY);
    
    cancelLongPress();
    
    // Return a cleanup function that can be used to clear the reset timeout
    return (): void => {
      if (resetTimeout) {
        window.clearTimeout(resetTimeout);
        resetTimeout = null;
      }
    };
  }, [cancelLongPress]);

  // Memoize the handlers object to prevent unnecessary re-renders
  const handlers: LongPressHandlers = useMemo(() => ({
    onMouseDown: handleInteractionStart as (e: MouseEventType) => void,
    onTouchStart: handleInteractionStart as (e: TouchEventType) => void,
    onMouseMove: handleInteractionMove as (e: MouseEventType) => void,
    onTouchMove: handleInteractionMove as (e: TouchEventType) => void,
    onMouseUp: handleInteractionEnd as (e: MouseEventType) => void,
    onMouseLeave: handleInteractionEnd as (e: MouseEventType) => void,
    onTouchEnd: handleInteractionEnd as (e: TouchEventType) => void,
    onTouchCancel: handleInteractionEnd as (e: TouchEventType) => void
  }), [
    handleInteractionStart,
    handleInteractionMove,
    handleInteractionEnd
  ]);

  return {
    isLongPressing,
    touchTrackingRef,
    handlers
  };
} 