
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format, addDays, subDays, isToday, isEqual, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DaySelectorStripProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

const NUM_DAYS_TO_SHOW = 3; // Hoy y dos días anteriores

export function DaySelectorStrip({
  selectedDate,
  onDateSelect,
}: DaySelectorStripProps) {
  const today = startOfDay(new Date());

  // Ensure selectedDate is not in the future
  const currentSelectedDate = selectedDate > today ? today : startOfDay(selectedDate);

  // Calculate the start date for the strip
  // It will always be [selectedDate - 2, selectedDate - 1, selectedDate]
  // We adjust if selectedDate is today or yesterday to keep "today" as the rightmost initial visible day
  let displayEndDate = currentSelectedDate;
  if (isToday(currentSelectedDate)) {
    displayEndDate = today;
  } else if (isEqual(currentSelectedDate, subDays(today, 1))) {
    displayEndDate = today;
  }


  const dates = Array.from({ length: NUM_DAYS_TO_SHOW }).map((_, i) =>
    subDays(displayEndDate, NUM_DAYS_TO_SHOW - 1 - i)
  ).filter(date => date <= today); // Ensure no future dates are generated initially

   // If initial generation results in fewer than 3 days (e.g. if today is the app's first day)
   // Pad with earlier days if possible, otherwise, it might show fewer.
   // This part is a bit tricky if we strictly want 3 days always.
   // For simplicity, let's ensure the array is always 3 days relative to displayEndDate
   let finalDates = Array.from({ length: NUM_DAYS_TO_SHOW }).map((_, i) =>
    subDays(displayEndDate, NUM_DAYS_TO_SHOW - 1 - i)
   );
   if (isToday(displayEndDate) && finalDates.length < NUM_DAYS_TO_SHOW) {
    // This case shouldn't happen if displayEndDate is today and NUM_DAYS_TO_SHOW is 3
    // But as a safeguard:
    finalDates = [subDays(today,2), subDays(today,1), today];
   }


  const handlePrevDays = () => {
    const newSelected = subDays(currentSelectedDate, 1);
    // Prevent selecting a date before the first possible date in the current view if it leads to no valid earlier days
    // This logic might need more refinement based on how far back user can go
    onDateSelect(newSelected < finalDates[0] ? newSelected : subDays(finalDates[0],1));
  };
  
  // Next button is removed as per requirement

  const handleDayClick = (date: Date) => {
    if (date <= today) { // Prevent selecting future dates
      onDateSelect(date);
    }
  };

  return (
    <div className="flex items-center justify-center space-x-1 sm:space-x-2 bg-card p-2 rounded-lg shadow">
      <Button variant="ghost" size="icon" onClick={handlePrevDays} className="h-8 w-8 sm:h-10 sm:w-10">
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <div className="flex-grow grid grid-cols-3 gap-1 overflow-x-auto"> {/* Changed to grid-cols-3 */}
        {finalDates.map((date) => {
          const isSelected = isEqual(date, currentSelectedDate);
          const isCurrentToday = isToday(date);
          return (
            <Button
              key={date.toISOString()}
              variant={isSelected ? 'default' : 'outline'}
              onClick={() => handleDayClick(date)}
              disabled={date > today} // Disable future dates
              className={cn(
                'flex flex-col items-center justify-center h-14 sm:h-16 w-full p-1 text-xs sm:text-sm rounded-md transition-all duration-150 ease-in-out',
                isSelected && 'bg-primary text-primary-foreground shadow-lg scale-105',
                !isSelected && 'bg-card hover:bg-muted/80',
                isCurrentToday && !isSelected && 'border-accent border-2',
                isCurrentToday && isSelected && 'ring-2 ring-offset-2 ring-accent',
                date > today && 'opacity-50 cursor-not-allowed'
              )}
            >
              <span className="font-medium capitalize">{isCurrentToday ? 'Hoy' : format(date, 'EEE', { locale: es })}</span>
              <span className="text-lg sm:text-xl font-bold">{format(date, 'd')}</span>
            </Button>
          );
        })}
      </div>
       {/* Placeholder for spacing, as ChevronRight is removed */}
      <div className="h-8 w-8 sm:h-10 sm:w-10"></div>
    </div>
  );
}

