
"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { HabitButton } from '@/components/habits/habit-button';
import { HabitForm } from '@/components/habits/habit-form';
import { DaySelectorStrip } from '@/components/habits/day-selector-strip';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PlusCircle, CalendarDays, Sparkles, Brain, Loader2, Check, AlertTriangle } from 'lucide-react';
import { useLifeQuest } from '@/hooks/use-life-quest-store';
import type { Habit } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { format, isToday, startOfDay } from 'date-fns';
import { suggestDisciplinesForSkill, type SuggestDisciplinesInput, type SuggestDisciplinesOutput } from '@/ai/flows/suggest-disciplines-flow';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

// Define an intermediate type for clarity and to potentially help the parser
type SingleAISuggestion = SuggestDisciplinesOutput['suggestions'][number];

interface SuggestedDisciplineDisplay extends SingleAISuggestion {
  // Para manejar estado local si ya fue añadida
  added?: boolean;
}

export default function HabitsPage() {
  const { player, habits, completeHabit, addHabit, updateHabit, isLoading } = useLifeQuest();
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date())); 

  const [isSuggestDialogVisible, setIsSuggestDialogVisible] = useState(false);
  const [selectedSkillForSuggestion, setSelectedSkillForSuggestion] = useState<string>('');
  const [aiSuggestions, setAiSuggestions] = useState<SuggestedDisciplineDisplay[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleOpenForm = (habit: Habit | null = null) => {
    setEditingHabit(habit);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setEditingHabit(null);
    setIsFormOpen(false);
  };

  const handleSubmitForm = (data: any) => { 
    if (editingHabit) {
      updateHabit(editingHabit.id, data);
    } else {
      addHabit(data);
    }
    handleCloseForm();
  };

  const handleToggleComplete = (habitId: string) => {
    completeHabit(habitId);
  };

  const isTodaySelected = isToday(selectedDate);
  const selectedDateString = format(selectedDate, 'yyyy-MM-dd');
  const todayString = format(startOfDay(new Date()), 'yyyy-MM-dd');

  const goodDailyHabits = useMemo(() => habits.filter(h => h.type === 'Good' && h.frequency === 'Daily'), [habits]);
  
  const goodHabitsCompletedTodayCount = useMemo(() => {
    return goodDailyHabits.filter(h => h.lastCompletedDate === todayString).length;
  }, [goodDailyHabits, todayString]);

  const dailyGoodHabitsCount = useMemo(() => {
    return goodDailyHabits.length;
  }, [goodDailyHabits]);

  const progressPercentage = dailyGoodHabitsCount > 0 ? (goodHabitsCompletedTodayCount / dailyGoodHabitsCount) * 100 : 0;
  
  const sortedHabits = [...habits].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const playerSkills = useMemo(() => {
    if (!player || !player.stats) return [];
    return Object.entries(player.stats).map(([name, data]) => ({
      name,
      description: player.statDescriptions?.[name] || 'Skill sin descripción detallada.',
      level: data.level,
    }));
  }, [player]);

  const handleFetchAiSuggestions = async () => {
    if (!selectedSkillForSuggestion || !player) return;
    setIsAiLoading(true);
    setAiError(null);
    setAiSuggestions([]);

    const skillData = playerSkills.find(s => s.name === selectedSkillForSuggestion);
    if (!skillData) {
      setAiError("Skill seleccionada no encontrada.");
      setIsAiLoading(false);
      return;
    }

    const input: SuggestDisciplinesInput = {
      skillName: skillData.name,
      skillDescription: skillData.description,
      existingDisciplineTitles: habits.map(h => h.title),
    };

    try {
      const result = await suggestDisciplinesForSkill(input);
      setAiSuggestions(result.suggestions.map(s => ({ ...s, added: false })));
    } catch (error: any) {
      console.error("Error generando sugerencias IA:", error);
      setAiError(error.message || "El Oráculo de Disciplinas está ocupado. Intenta más tarde.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAddSuggestedDiscipline = (suggestion: SuggestedDisciplineDisplay, index: number) => {
    if (!selectedSkillForSuggestion) return;

    const newHabitData = {
      title: suggestion.title,
      description: suggestion.description,
      difficulty: suggestion.difficulty as 'Easy' | 'Hard',
      type: 'Good' as 'Good',
      frequency: 'Daily' as 'Daily',
      targetStat: selectedSkillForSuggestion,
    };
    addHabit(newHabitData);
    toast({
        title: "Disciplina Añadida",
        description: `"${suggestion.title}" ha sido forjada.`,
    });
    
    // Marcar como añadida para actualizar UI del botón en el diálogo
    setAiSuggestions(prev => prev.map((s, i) => i === index ? { ...s, added: true } : s));
  };


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
          <span className="text-card-foreground">Progreso Disciplinas Diarias (Hoy)</span>
          <span className="text-primary">{goodHabitsCompletedTodayCount} / {dailyGoodHabitsCount}</span>
        </div>
        <Progress value={progressPercentage} className="h-2.5 [&>div]:bg-gradient-to-r [&>div]:from-green-400 [&>div]:to-emerald-500" />
        <p className="text-xs text-muted-foreground text-center">
          Has completado {goodHabitsCompletedTodayCount} de {dailyGoodHabitsCount} buenas disciplinas diarias hoy.
        </p>
      </div>
      
      <Button 
        onClick={() => setIsSuggestDialogVisible(true)} 
        variant="outline" 
        className="w-full p5-button-secondary flex items-center justify-center gap-2 group hover:shadow-lg transition-shadow"
      >
        <Sparkles className="h-5 w-5 text-yellow-400 group-hover:animate-pulse" />
        Sugerir Disciplinas con IA
        <Brain className="h-5 w-5 text-purple-400" />
      </Button>

      <DaySelectorStrip selectedDate={selectedDate} onDateSelect={setSelectedDate} />

      {sortedHabits.length === 0 && !isSuggestDialogVisible ? (
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
            const isActionDisabledForToday = 
              isTodaySelected &&
              habit.type === 'Good' &&
              habit.frequency === 'Daily' &&
              habit.lastCompletedDate === todayString;

            return (
              <HabitButton
                key={habit.id}
                habit={habit}
                isCompletedOnSelectedDay={isCompletedOnSelectedDay}
                isTodaySelected={isTodaySelected}
                onToggleComplete={handleToggleComplete}
                onEdit={handleOpenForm}
                isActionDisabled={isActionDisabledForToday}
              />
            );
          })}
        </div>
      )}
      
      <Button
        onClick={() => handleOpenForm()}
        className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 md:hidden z-30 p5-button-accent rounded-full h-14 w-14 shadow-xl"
        aria-label="Forjar Nueva Disciplina"
      >
        <PlusCircle className="h-7 w-7" />
      </Button>
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
          <div className="px-6 pb-6">
            <HabitForm
              habit={editingHabit}
              onSubmit={handleSubmitForm}
              onCancel={handleCloseForm}
              submitButtonText={editingHabit ? 'Actualizar Disciplina' : 'Forjar Disciplina'}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialogo para Sugerencias IA */}
      <Dialog open={isSuggestDialogVisible} onOpenChange={(isOpen) => {
          setIsSuggestDialogVisible(isOpen);
          if (!isOpen) { // Resetear estado al cerrar
            setSelectedSkillForSuggestion('');
            setAiSuggestions([]);
            setAiError(null);
          }
        }}>
        <DialogContent className="sm:max-w-xl bg-card max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="text-2xl p5-text-shadow flex items-center gap-2"><Sparkles className="text-yellow-400"/>Sugerencias del Oráculo</DialogTitle>
            <DialogDescription>
              Elige una de tus skills y el Oráculo te propondrá disciplinas para potenciarla.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-6 space-y-6">
            <div className="space-y-2">
              <label htmlFor="skill-select-suggestion" className="text-sm font-medium text-card-foreground">
                Skill a Mejorar:
              </label>
              <Select 
                value={selectedSkillForSuggestion} 
                onValueChange={setSelectedSkillForSuggestion}
                disabled={isAiLoading}
              >
                <SelectTrigger id="skill-select-suggestion" className="w-full">
                  <SelectValue placeholder="Selecciona una skill..." />
                </SelectTrigger>
                <SelectContent>
                  {playerSkills.length > 0 ? playerSkills.map(skill => (
                    <SelectItem key={skill.name} value={skill.name}>
                      {skill.name} (Nivel {skill.level})
                    </SelectItem>
                  )) : <SelectItem value="no-skills" disabled>No tienes skills definidas.</SelectItem>}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleFetchAiSuggestions} 
              disabled={!selectedSkillForSuggestion || isAiLoading}
              className="w-full p5-button-primary"
            >
              {isAiLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isAiLoading ? "Consultando Oráculo..." : "Obtener Sugerencias"}
            </Button>

            {aiError && (
              <p className="text-sm text-destructive text-center p-3 bg-destructive/10 rounded-md flex items-center justify-center">
                <AlertTriangle className="mr-2 h-4 w-4"/> {aiError}
              </p>
            )}

            {aiSuggestions.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="text-lg font-semibold text-center text-primary">Disciplinas Propuestas para "{selectedSkillForSuggestion}"</h3>
                {aiSuggestions.map((suggestion, index) => (
                  <Card key={index} className="bg-muted/30 shadow-sm">
                    <CardHeader className="!py-3 !px-4 flex flex-row justify-between items-center">
                      <CardTitle className="text-md">{suggestion.title}</CardTitle>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${suggestion.difficulty === 'Easy' ? 'bg-green-500/20 text-green-700' : 'bg-orange-500/20 text-orange-700'}`}>
                        {suggestion.difficulty}
                      </span>
                    </CardHeader>
                    <CardContent className="!p-4 !pt-0 text-sm">
                      <p className="text-muted-foreground">{suggestion.description}</p>
                    </CardContent>
                    <CardFooter className="!p-3 bg-muted/10">
                      <Button 
                        size="sm" 
                        onClick={() => handleAddSuggestedDiscipline(suggestion, index)}
                        disabled={suggestion.added}
                        className="w-full p5-button-accent"
                      >
                        {suggestion.added ? <><Check className="mr-2"/> Añadida</> : "Añadir esta Disciplina"}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
          <DialogFooter className="p-4 border-t">
            <DialogClose asChild>
                <Button variant="outline">Cerrar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

    