
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format, addDays, subDays, isToday, isEqual, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

interface DaySelectorStripProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

const NUM_DAYS_TO_SHOW = 4; // Hoy y tres días anteriores

export function DaySelectorStrip({
  selectedDate,
  onDateSelect,
}: DaySelectorStripProps) {
  const today = startOfDay(new Date());

  // Ensure selectedDate is not in the future and is one of the 4 displayable days
  let currentSelectedDate = startOfDay(selectedDate);
  if (currentSelectedDate > today) {
    currentSelectedDate = today;
  } else if (currentSelectedDate < subDays(today, NUM_DAYS_TO_SHOW - 1)) {
    // If selected date is older than the 4-day window, select the oldest displayable day
    currentSelectedDate = subDays(today, NUM_DAYS_TO_SHOW - 1);
  }
  

  const dates = Array.from({ length: NUM_DAYS_TO_SHOW }).map((_, i) =>
    subDays(today, NUM_DAYS_TO_SHOW - 1 - i)
  ).reverse(); // Reverse to have today on the far right, older days to the left

  const handleDayClick = (date: Date) => {
    onDateSelect(date);
  };

  return (
    <div className="flex items-center justify-center space-x-1 sm:space-x-2 bg-card p-2 rounded-lg shadow">
      <div className="flex-grow grid grid-cols-4 gap-1 sm:gap-2 overflow-x-auto">
        {dates.map((date) => {
          const isSelected = isEqual(date, currentSelectedDate);
          const isCurrentToday = isToday(date);
          return (
            <Button
              key={date.toISOString()}
              variant={isSelected ? 'default' : 'outline'}
              onClick={() => handleDayClick(date)}
              className={cn(
                'flex flex-col items-center justify-center h-14 sm:h-16 w-full p-1 text-xs sm:text-sm rounded-md transition-all duration-150 ease-in-out',
                isSelected && 'bg-primary text-primary-foreground shadow-lg scale-105',
                !isSelected && 'bg-card hover:bg-muted/80',
                isCurrentToday && !isSelected && 'border-accent border-2',
                isCurrentToday && isSelected && 'ring-2 ring-offset-2 ring-accent',
              )}
            >
              <span className="font-medium capitalize">{isCurrentToday ? 'Hoy' : format(date, 'EEE', { locale: es })}</span>
              <span className="text-lg sm:text-xl font-bold">{format(date, 'd')}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
