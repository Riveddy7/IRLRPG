
"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { HabitButton } from '@/components/habits/habit-button';
import { HabitForm } from '@/components/habits/habit-form';
import { DaySelectorStrip } from '@/components/habits/day-selector-strip';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PlusCircle, Edit, CalendarDays } from 'lucide-react';
import { useLifeQuest } from '@/hooks/use-life-quest-store';
import type { Habit } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { format, isToday, isEqual, startOfDay } from 'date-fns';

export default function HabitsPage() {
  const { player, habits, completeHabit, addHabit, updateHabit, isLoading } = useLifeQuest();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date())); // Default to today

  useEffect(() => {
    // Ensure selectedDate doesn't go into the future if somehow set externally
    if (selectedDate > startOfDay(new Date())) {
      setSelectedDate(startOfDay(new Date()));
    }
  }, [selectedDate]);

  const handleOpenForm = (habit: Habit | null = null) => {
    setEditingHabit(habit);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setEditingHabit(null);
    setIsFormOpen(false);
  };

  const handleSubmitForm = (data: any) => { // data type from HabitFormValues
    if (editingHabit) {
      updateHabit(editingHabit.id, data);
    } else {
      addHabit(data);
    }
    handleCloseForm();
  };

  const handleToggleComplete = (habitId: string) => {
    // The store's completeHabit function already checks if it's today and if it's already completed.
    completeHabit(habitId);
  };
  
  const isTodaySelected = isToday(selectedDate);
  const selectedDateString = format(selectedDate, 'yyyy-MM-dd');

  const goodHabits = useMemo(() => habits.filter(h => h.type === 'Good'), [habits]);
  
  const goodHabitsCompletedToday = useMemo(() => {
    const todayString = format(new Date(), 'yyyy-MM-dd');
    return goodHabits.filter(h => h.lastCompletedDate === todayString).length;
  }, [goodHabits, habits]);

  const progressPercentage = goodHabits.length > 0 ? (goodHabitsCompletedToday / goodHabits.length) * 100 : 0;
  
  const sortedHabits = [...habits].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (isLoading || !player) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Skeleton className="h-8 w-3/4 mb-2" />
        <Skeleton className="h-10 w-full mb-4" />
        <Skeleton className="h-16 w-full mb-6" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 p-0 sm:p-2 md:p-4">
      <div className="px-4 sm:px-0">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight p5-text-shadow">
          Bienvenido/a, {player.name}!
        </h1>
        <p className="text-muted-foreground">Tu senda de la disciplina.</p>
      </div>

      <div className="bg-card p-4 rounded-lg shadow space-y-3">
        <div className="flex justify-between items-center text-sm font-medium">
          <span className="text-card-foreground">Progreso Diario (Hoy)</span>
          <span className="text-primary">{goodHabitsCompletedToday} / {goodHabits.length}</span>
        </div>
        <Progress value={progressPercentage} className="h-2.5 [&>div]:bg-gradient-to-r [&>div]:from-green-400 [&>div]:to-emerald-500" />
        <p className="text-xs text-muted-foreground text-center">
          Has completado {goodHabitsCompletedToday} de {goodHabits.length} buenas disciplinas hoy.
        </p>
      </div>
      
      <DaySelectorStrip selectedDate={selectedDate} onDateSelect={setSelectedDate} />

      {sortedHabits.length === 0 ? (
         <div className="text-center py-10 px-4 bg-card/50 rounded-lg shadow">
          <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
          <h3 className="mt-4 text-lg font-semibold text-muted-foreground">Forja tu Primera Disciplina</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            El camino hacia la maestría comienza con un solo paso. Define tus hábitos.
          </p>
          <Button onClick={() => handleOpenForm()} className="mt-6 p5-button-primary">
              <PlusCircle className="mr-2 h-4 w-4" /> Forjar Disciplina
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedHabits.map((habit) => {
            const isCompletedOnSelectedDay = habit.lastCompletedDate === selectedDateString;
            // Check if the habit (if good, daily) was already completed today, to potentially disable further clicks
            // This logic is already handled by the store, but good for UI cues if needed
            const isGoodHabitCompletedToday = habit.type === 'Good' && habit.frequency === 'Daily' && habit.lastCompletedDate === format(new Date(), 'yyyy-MM-dd');

            return (
              <HabitButton
                key={habit.id}
                habit={habit}
                isCompletedOnSelectedDay={isCompletedOnSelectedDay}
                isTodaySelected={isTodaySelected}
                onToggleComplete={handleToggleComplete}
                onEdit={handleOpenForm}
                isActionDisabled={isGoodHabitCompletedToday && isTodaySelected && habit.type === 'Good'} // Pass this to potentially disable click
              />
            );
          })}
        </div>
      )}
      
      {/* Botón flotante para añadir nueva disciplina, más accesible en móvil */}
      <Button
        onClick={() => handleOpenForm()}
        className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 md:hidden z-30 p5-button-accent rounded-full h-14 w-14 shadow-xl"
        aria-label="Forjar Nueva Disciplina"
      >
        <PlusCircle className="h-7 w-7" />
      </Button>
       {/* Botón regular para desktop */}
      <Button 
        onClick={() => handleOpenForm()} 
        className="hidden md:flex p5-button-accent fixed bottom-6 right-6 z-30 shadow-xl"
        aria-label="Forjar Nueva Disciplina Desktop"
      >
        <PlusCircle className="mr-2 h-5 w-5" /> Forjar Disciplina
      </Button>


      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-lg bg-card max-h-[85vh] overflow-y-auto p-0">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="text-2xl p5-text-shadow">{editingHabit ? 'Refinar Disciplina' : 'Forjar Nueva Disciplina'}</DialogTitle>
            <DialogDescription>
              {editingHabit ? 'Ajusta los parámetros de esta disciplina.' : 'Define un nuevo hábito a dominar.'}
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-6"> {/* Contenedor para el scroll del form */}
            <HabitForm
              habit={editingHabit}
              onSubmit={handleSubmitForm}
              onCancel={handleCloseForm}
              submitButtonText={editingHabit ? 'Actualizar Disciplina' : 'Forjar Disciplina'}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

