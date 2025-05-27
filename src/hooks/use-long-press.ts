
"use client";
import type { RefObject } from 'react';
import { useCallback, useRef, useState } from 'react';

export interface LongPressOptions {
  shouldPreventDefault?: boolean;
  delay?: number;
}

// Helper function to check if the event is a touch event
function isTouchEvent(event: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent): event is TouchEvent {
  return "touches" in event;
}

// Helper function to safely access event.target
function getEventTarget(event: React.MouseEvent | React.TouchEvent): EventTarget | null {
  return event.target;
}

const preventDefault = (event: Event) => {
  if (isTouchEvent(event) && event.touches.length > 0) {
    return; 
  }
  if (event.cancelable) {
    event.preventDefault();
  }
};

const MOVE_THRESHOLD = 10; // Pixels

export const useLongPress = (
  onLongPress: (event: React.MouseEvent | React.TouchEvent) => void,
  onClick?: (event: React.MouseEvent | React.TouchEvent) => void,
  { shouldPreventDefault = true, delay = 400 }: LongPressOptions = {}
) => {
  const [longPressTriggered, setLongPressTriggered] = useState(false);
  const timeout = useRef<NodeJS.Timeout>();
  const targetRef = useRef<EventTarget | null>(null);
  const pressStartCoords = useRef<{ x: number, y: number } | null>(null);

  const start = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      if ('button' in event && (event as React.MouseEvent).button === 2) {
        return;
      }

      targetRef.current = getEventTarget(event);
      setLongPressTriggered(false); // Reset on new press start

      if (isTouchEvent(event)) {
        pressStartCoords.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
      } else if ('clientX' in event) { // MouseEvent
        pressStartCoords.current = { x: event.clientX, y: event.clientY };
      }

      timeout.current = setTimeout(() => {
        // Only trigger long press if not cancelled by movement
        if (pressStartCoords.current) { 
          onLongPress(event);
          setLongPressTriggered(true);
        }
      }, delay);
    },
    [onLongPress, delay]
  );

  const clear = useCallback(
    (event: React.MouseEvent | React.TouchEvent, shouldTriggerClick = true) => {
      if ('button' in event && (event as React.MouseEvent).button === 2) {
        pressStartCoords.current = null;
        if (timeout.current) clearTimeout(timeout.current);
        return;
      }

      let movedTooMuch = false;
      if (pressStartCoords.current) {
        let currentX, currentY;
        if (isTouchEvent(event)) {
          currentX = event.changedTouches[0].clientX;
          currentY = event.changedTouches[0].clientY;
        } else if ('clientX' in event) { // MouseEvent
          currentX = event.clientX;
          currentY = event.clientY;
        }

        if (currentX !== undefined && currentY !== undefined) {
          const deltaX = Math.abs(currentX - pressStartCoords.current.x);
          const deltaY = Math.abs(currentY - pressStartCoords.current.y);
          if (deltaX > MOVE_THRESHOLD || deltaY > MOVE_THRESHOLD) {
            movedTooMuch = true;
          }
        }
      }

      if (timeout.current) {
        clearTimeout(timeout.current);
      }

      if (movedTooMuch) {
        setLongPressTriggered(false); // Ensure long press is also cancelled if moved
        pressStartCoords.current = null;
        return; 
      }
      
      if (shouldTriggerClick && !longPressTriggered && onClick) {
        onClick(event);
      }
      
      setLongPressTriggered(false);
      pressStartCoords.current = null; 
    },
    [onClick, longPressTriggered]
  );
  
  const handleContextMenu = (event: React.MouseEvent) => {
    if (shouldPreventDefault) {
      event.preventDefault();
    }
  };

  // Added onMouseMove and onTouchMove to cancel timeout if significant movement occurs *during* the press
  const handleMove = (event: React.MouseEvent | React.TouchEvent) => {
    if (!pressStartCoords.current) return;

    let currentX, currentY;
    if (isTouchEvent(event)) {
      currentX = event.touches[0].clientX;
      currentY = event.touches[0].clientY;
    } else if ('clientX' in event) { // MouseEvent
      currentX = event.clientX;
      currentY = event.clientY;
    } else {
      return;
    }

    if (currentX !== undefined && currentY !== undefined) {
      const deltaX = Math.abs(currentX - pressStartCoords.current.x);
      const deltaY = Math.abs(currentY - pressStartCoords.current.y);
      if (deltaX > MOVE_THRESHOLD || deltaY > MOVE_THRESHOLD) {
        if (timeout.current) clearTimeout(timeout.current);
        pressStartCoords.current = null; // Mark as moved, so 'clear' won't trigger click
        // No need to setLongPressTriggered(false) here, timeout clear handles it for long press.
      }
    }
  };

  return {
    onMouseDown: (e: React.MouseEvent) => start(e),
    onTouchStart: (e: React.TouchEvent) => start(e),
    onMouseUp: (e: React.MouseEvent) => clear(e),
    onMouseMove: (e: React.MouseEvent) => { // Only listen if mouse is down (button pressed)
        if (e.buttons === 1) handleMove(e);
    },
    onTouchMove: (e: React.TouchEvent) => handleMove(e),
    onMouseLeave: (e: React.MouseEvent) => {
        // If mouse leaves while pressed, treat as a cancel (no click, no long press)
        if (pressStartCoords.current) {
             if (timeout.current) clearTimeout(timeout.current);
             setLongPressTriggered(false);
             pressStartCoords.current = null;
        }
    },
    onTouchEnd: (e: React.TouchEvent) => clear(e),
    onContextMenu: handleContextMenu,
  };
};
