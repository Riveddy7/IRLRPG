
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format, addDays, subDays, isToday, isEqual } from 'date-fns';
import { es } from 'date-fns/locale'; // For Spanish day names
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DaySelectorStripProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  numDaysToShow?: number; // Total days to show (e.g., 7 for a week view)
}

export function DaySelectorStrip({
  selectedDate,
  onDateSelect,
  numDaysToShow = 7,
}: DaySelectorStripProps) {
  const today = new Date();
  const daysBefore = Math.floor((numDaysToShow - 1) / 2);
  
  // Calculate the start date for the strip such that selectedDate is roughly in the middle
  let startDate = subDays(selectedDate, daysBefore);

  const dates = Array.from({ length: numDaysToShow }).map((_, i) =>
    addDays(startDate, i)
  );

  const handlePrevWeek = () => {
    onDateSelect(subDays(selectedDate, numDaysToShow));
  };

  const handleNextWeek = () => {
    onDateSelect(addDays(selectedDate, numDaysToShow));
  };

  const handleDayClick = (date: Date) => {
    onDateSelect(date);
  };

  return (
    <div className="flex items-center justify-center space-x-1 sm:space-x-2 bg-card p-2 rounded-lg shadow">
      <Button variant="ghost" size="icon" onClick={handlePrevWeek} className="h-8 w-8 sm:h-10 sm:w-10">
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <div className="flex-grow grid grid-cols-7 gap-1 overflow-x-auto">
        {dates.map((date) => {
          constisSelected = isEqual(date, selectedDate);
          constisCurrentToday = isToday(date);
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
                isCurrentToday && isSelected && 'ring-2 ring-offset-2 ring-accent'
              )}
            >
              <span className="font-medium capitalize">{format(date, 'EEE', { locale: es })}</span>
              <span className="text-lg sm:text-xl font-bold">{format(date, 'd')}</span>
            </Button>
          );
        })}
      </div>
      <Button variant="ghost" size="icon" onClick={handleNextWeek} className="h-8 w-8 sm:h-10 sm:w-10">
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
}
