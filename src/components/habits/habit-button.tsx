
"use client";

import React from 'react';
import type { Habit } from '@/types';
import { Button } from '@/components/ui/button';
import { cn }
from '@/lib/utils';
import { useLongPress, type LongPressOptions } from '@/hooks/use-long-press';
import { CheckCircle, XCircle, Edit3, TrendingUp, TrendingDown } from 'lucide-react';

interface HabitButtonProps {
  habit: Habit;
  isCompletedOnSelectedDay: boolean;
  isTodaySelected: boolean;
  onToggleComplete: (habitId: string) => void;
  onEdit: (habit: Habit) => void;
}

export function HabitButton({
  habit,
  isCompletedOnSelectedDay,
  isTodaySelected,
  onToggleComplete,
  onEdit,
}: HabitButtonProps) {
  
  const handleShortClick = () => {
    if (isTodaySelected) {
      onToggleComplete(habit.id);
    }
  };

  const handleLongPress = () => {
    onEdit(habit);
  };

  const longPressBindings = useLongPress(handleLongPress, handleShortClick, { delay: 500 });

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
        !isTodaySelected && 'opacity-70 cursor-not-allowed hover:bg-card',
      )}
      aria-label={`${habit.title}. ${isCompletedOnSelectedDay ? 'Completado' : 'Pendiente'}. ${isTodaySelected ? 'Pulsar para marcar, mantener para editar.' : 'Mantener para editar.'}`}
      // Tooltip could be added here for more info on long press
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
          isTodaySelected && (
            <div className="h-5 w-5 sm:h-6 sm:w-6 border-2 border-dashed border-muted-foreground/50 rounded-full" />
          )
        )}
        {!isTodaySelected && !isCompletedOnSelectedDay && (
           <div className="h-5 w-5 sm:h-6 sm:w-6 border-2 border-muted-foreground/30 rounded-full" />
        )}
         {/* Edit icon hint, could be conditional based on long press capability */}
         {/* <Edit3 className="h-4 w-4 text-muted-foreground/50 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"/> */}
      </div>
    </Button>
  );
}
