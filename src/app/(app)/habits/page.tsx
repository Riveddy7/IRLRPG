
"use client";
import React, { useState } from 'react';
import { HabitCard } from '@/components/habits/habit-card';
import { HabitForm } from '@/components/habits/habit-form';
import { Button } from '@/components/ui/button';
import { PlusCircle, AlertTriangle } from 'lucide-react';
import { useLifeQuest } from '@/hooks/use-life-quest-store';
import type { Habit } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

export default function HabitsPage() {
  const { habits, addHabit, updateHabit, isLoading } = useLifeQuest();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

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
  
  const sortedHabits = [...habits].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());


  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-72 rounded-lg" />)}
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight p5-text-shadow">Your Disciplines</h1>
        <Button onClick={() => handleOpenForm()} className="p5-button-accent w-full sm:w-auto">
          <PlusCircle className="mr-2 h-5 w-5" /> New Discipline
        </Button>
      </div>

      {sortedHabits.length === 0 ? (
         <div className="text-center py-12 bg-card/50 rounded-lg shadow">
          <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
          <h3 className="mt-4 text-xl font-semibold text-muted-foreground">No Disciplines Forged</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Your path to mastery is clear. Start by forging new disciplines.
          </p>
          <Button onClick={() => handleOpenForm()} className="mt-6 p5-button-primary">
              <PlusCircle className="mr-2 h-4 w-4" /> Forge First Discipline
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sortedHabits.map((habit) => (
            <HabitCard key={habit.id} habit={habit} onEdit={() => handleOpenForm(habit)} />
          ))}
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-lg bg-card max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl p5-text-shadow">{editingHabit ? 'Refine Discipline' : 'Forge New Discipline'}</DialogTitle>
            <DialogDescription>
              {editingHabit ? 'Adjust the parameters of this discipline.' : 'Define a new habit to master.'}
            </DialogDescription>
          </DialogHeader>
          <HabitForm
            habit={editingHabit}
            onSubmit={handleSubmitForm}
            onCancel={handleCloseForm}
            submitButtonText={editingHabit ? 'Update Discipline' : 'Forge Discipline'}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
