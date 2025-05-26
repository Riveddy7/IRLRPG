
"use client";
import type { RefObject } from 'react';
import { useCallback, useRef, useState } from 'react';

export interface LongPressOptions {
  shouldPreventDefault?: boolean;
  delay?: number;
}

// Helper function to check if the event is a touch event
function isTouchEvent(event: Event): event is TouchEvent {
  return "touches" in event;
}

// Helper function to safely access event.target
function getEventTarget(event: React.MouseEvent | React.TouchEvent): EventTarget | null {
  return event.target;
}


const preventDefault = (event: Event) => {
  // Check if the event is a TouchEvent and if there are still active touches
  if (isTouchEvent(event) && event.touches.length > 0) {
    return; // Do not prevent default if there are still active touches (e.g., for scrolling)
  }
  if (event.cancelable) {
    event.preventDefault();
  }
};

export const useLongPress = (
  onLongPress: (event: React.MouseEvent | React.TouchEvent) => void,
  onClick?: (event: React.MouseEvent | React.TouchEvent) => void,
  { shouldPreventDefault = true, delay = 400 }: LongPressOptions = {}
) => {
  const [longPressTriggered, setLongPressTriggered] = useState(false);
  const timeout = useRef<NodeJS.Timeout>();
  const targetRef = useRef<EventTarget | null>(null); // To store the event target

  const start = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      // Prevent context menu on right-click if it's a mouse event
      if ('button' in event && (event as React.MouseEvent).button === 2) {
        return;
      }

      targetRef.current = getEventTarget(event); // Store the target

      if (shouldPreventDefault && targetRef.current) {
        targetRef.current.addEventListener('touchend', preventDefault, { passive: false });
        // For mouse, context menu is handled by onContextMenu
      }

      timeout.current = setTimeout(() => {
        onLongPress(event);
        setLongPressTriggered(true);
      }, delay);
    },
    [onLongPress, delay, shouldPreventDefault]
  );

  const clear = useCallback(
    (event: React.MouseEvent | React.TouchEvent, shouldTriggerClick = true) => {
       // Prevent context menu on mouse up if long press was not triggered
      if ('button' in event && (event as React.MouseEvent).button === 2) {
        // if (longPressTriggered) event.preventDefault(); // Already handled by onContextMenu
        return;
      }

      if (timeout.current) {
        clearTimeout(timeout.current);
      }

      if (shouldTriggerClick && !longPressTriggered && onClick) {
        onClick(event);
      }
      
      setLongPressTriggered(false);

      if (shouldPreventDefault && targetRef.current) {
        targetRef.current.removeEventListener('touchend', preventDefault);
      }
    },
    [shouldPreventDefault, onClick, longPressTriggered]
  );
  
  const handleContextMenu = (event: React.MouseEvent) => {
    // Prevent context menu if long press is configured,
    // as right-click often triggers context menu which we want to avoid if it's used for long press.
    if (shouldPreventDefault) {
      event.preventDefault();
    }
  };

  return {
    onMouseDown: (e: React.MouseEvent) => start(e),
    onTouchStart: (e: React.TouchEvent) => start(e),
    onMouseUp: (e: React.MouseEvent) => clear(e),
    onMouseLeave: (e: React.MouseEvent) => clear(e, false), // مهمه لمنع التشغيل عند ترك الماوس
    onTouchEnd: (e: React.TouchEvent) => clear(e),
    onContextMenu: handleContextMenu, // Prevent context menu on right-click
  };
};
