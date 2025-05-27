
"use client";

import React from 'react';
import type { Habit } from '@/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLongPress } from '@/hooks/use-long-press';
import { CheckCircle, XCircle, Edit3, TrendingUp, TrendingDown } from 'lucide-react';

interface HabitButtonProps {
  habit: Habit;
  isCompletedOnSelectedDay: boolean;
  isTodaySelected: boolean;
  onToggleComplete: (habitId: string) => void;
  onEdit: (habit: Habit) => void;
  // isActionDisabled prop is removed as toggling is now the default for today
}

export function HabitButton({
  habit,
  isCompletedOnSelectedDay,
  isTodaySelected,
  onToggleComplete,
  onEdit,
}: HabitButtonProps) {
  
  const handleShortClick = () => {
    if (isTodaySelected) { // Action (complete/uncomplete) only allowed for today
      onToggleComplete(habit.id);
    }
  };

  const handleLongPress = () => {
    onEdit(habit);
  };

  // Click handler is active only if it's today
  const clickHandler = isTodaySelected ? handleShortClick : undefined;
  const longPressBindings = useLongPress(handleLongPress, clickHandler, { delay: 500 });

  const Icon = habit.type === 'Good' ? TrendingUp : TrendingDown;

  return (
    <Button
      {...longPressBindings}
      variant="outline"
      className={cn(
        "w-full h-auto min-h-[60px] sm:min-h-[72px] p-3 sm:p-4 flex justify-between items-center text-left rounded-lg shadow-sm transition-all duration-200 ease-in-out",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isCompletedOnSelectedDay && habit.type === 'Good' && 'bg-green-500/20 border-green-500 hover:bg-green-500/30 text-green-700 dark:text-green-300',
        isCompletedOnSelectedDay && habit.type === 'Bad' && 'bg-red-500/20 border-red-500 hover:bg-red-500/30 text-red-700 dark:text-red-300',
        !isCompletedOnSelectedDay && 'bg-card hover:bg-muted/50',
        // Visual cue if not today, short click is disabled
        !isTodaySelected && 'opacity-70 cursor-default hover:bg-card', 
      )}
      aria-label={`${habit.title}. ${isCompletedOnSelectedDay ? 'Completado' : 'Pendiente'}. ${
        isTodaySelected 
          ? 'Pulsar para marcar/desmarcar, mantener para editar.'
          : 'Ver estado. Mantener para editar.'
      }`}
      // Prevent click events (short press) on non-today dates, except for long press (handled by useLongPress)
      onClickCapture={!isTodaySelected ? (e) => e.stopPropagation() : undefined}
    >
      <div className="flex items-center">
        <Icon className={cn(
            "h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 shrink-0",
            habit.type === 'Good' ? 'text-green-600' : 'text-red-600',
            isCompletedOnSelectedDay && habit.type === 'Good' && 'text-green-500',
            isCompletedOnSelectedDay && habit.type === 'Bad' && 'text-red-500',
         )} />
        <span className="font-medium text-sm sm:text-base text-card-foreground truncate" title={habit.title}>
          {habit.title}
        </span>
      </div>
      
      <div className="flex items-center shrink-0">
        {isCompletedOnSelectedDay ? (
            habit.type === 'Good' ? (
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
            ) : ( 
                <XCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-500" />
            )
        ) : (
          // Show pending circle only if it's today and not completed
          isTodaySelected && (
            <div className="h-5 w-5 sm:h-6 sm:w-6 border-2 border-dashed border-muted-foreground/50 rounded-full" />
          )
        )}
        {/* For past days, if not completed, show a dimmer circle or nothing */}
        {!isTodaySelected && !isCompletedOnSelectedDay && ( 
           <div className="h-5 w-5 sm:h-6 sm:w-6 border-2 border-muted-foreground/30 rounded-full" />
        )}
      </div>
    </Button>
  );
}
