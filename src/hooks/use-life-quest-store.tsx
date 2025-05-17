
"use client";

import type { Player, PlayerStats, Task, Habit, TaskStatus } from '@/types';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { MAX_LEVEL, getLevelFromXP } from '@/config/game-config'; // STAT_NAMES ya no es la fuente principal para el perfil
import { useToast } from './use-toast';
import { db } from '@/lib/firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  addDoc,
  query,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { useAuth } from './use-auth';

interface LifeQuestContextType {
  player: Player | null;
  tasks: Task[];
  habits: Habit[];
  isLoading: boolean; 
  addTask: (taskData: Omit<Task, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  updateTask: (taskId: string, taskData: Partial<Omit<Task, 'id' | 'createdAt'>>) => Promise<void>;
  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  addHabit: (habitData: Omit<Habit, 'id' | 'createdAt' | 'currentStreak' | 'longestStreak' | 'lastCompletedDate'>) => Promise<void>;
  updateHabit: (habitId: string, habitData: Partial<Omit<Habit, 'id' | 'createdAt'>>) => Promise<void>;
  completeHabit: (habitId: string) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
  updatePlayerProfileAfterQuiz: (quizData: Partial<Player>) => Promise<void>;
}

const LifeQuestContext = createContext<LifeQuestContextType | undefined>(undefined);

export const LifeQuestProvider = ({ children }: { children: ReactNode }) => {
  const { user, isLoading: authIsLoading } = useAuth(); 
  const [player, setPlayer] = useState<Player | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  const userId = user?.uid;

  useEffect(() => {
    if (authIsLoading) {
      setIsLoading(true); 
      return;
    }

    if (!userId) {
      setPlayer(null);
      setTasks([]);
      setHabits([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const playerDocRef = doc(db, 'players', userId);

    const unsubscribePlayer = onSnapshot(playerDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setPlayer(docSnap.data() as Player);
      } else {
        // Esto es manejado por useAuth que crea el documento inicial con hasCompletedQuiz: false
        // Si estamos aquí y no existe, podría ser un delay o un problema.
        // AppLayout redirigirá a /quiz si hasCompletedQuiz es false.
        setPlayer(null);
      }
      //setIsLoading(false); // Se mueve para combinar con los otros listeners
    }, (error) => {
      console.error(`Error fetching player data for UID ${userId}:`, error);
      toast({ title: "Error", description: "No se pudieron cargar los datos del jugador.", variant: "destructive" });
      setPlayer(null);
      //setIsLoading(false);
    });

    const tasksQuery = query(collection(db, 'players', userId, 'tasks'));
    const unsubscribeTasks = onSnapshot(tasksQuery, (querySnapshot) => {
      const tasksData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: (data.createdAt as Timestamp)?.toDate().toISOString(),
          dueDate: data.dueDate ? (data.dueDate as Timestamp).toDate().toISOString() : undefined,
        } as Task;
      });
      setTasks(tasksData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }, (error) => {
      console.error(`Error fetching tasks for UID ${userId}:`, error);
      toast({ title: "Error", description: "No se pudieron cargar las misiones.", variant: "destructive" });
    });

    const habitsQuery = query(collection(db, 'players', userId, 'habits'));
    const unsubscribeHabits = onSnapshot(habitsQuery, (querySnapshot) => {
      const habitsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: (data.createdAt as Timestamp)?.toDate().toISOString(),
          lastCompletedDate: data.lastCompletedDate ? (data.lastCompletedDate as Timestamp).toDate().toISOString().split('T')[0] : undefined,
        } as Habit;
      });
      setHabits(habitsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }, (error) => {
      console.error(`Error fetching habits for UID ${userId}:`, error);
      toast({ title: "Error", description: "No se pudieron cargar las disciplinas.", variant: "destructive" });
    });
    
    const checkInitialLoad = async () => {
      try {
        if (userId) {
          await getDoc(playerDocRef); 
        }
      } catch(e) {
        // Error ya manejado
      } finally {
        if (!authIsLoading) { // Solo deja de cargar si la autenticación también terminó
             setIsLoading(false);
        }
      }
    };
    checkInitialLoad();

    return () => {
      unsubscribePlayer();
      unsubscribeTasks();
      unsubscribeHabits();
    };
  }, [userId, authIsLoading, toast]);


  const addXP = useCallback(async (amount: number) => {
    if (!userId || !player) return; 
    const playerDocRef = doc(db, 'players', userId);
    const newXP = player.xp + amount;
    const newLevel = getLevelFromXP(newXP);
    
    const updates: Partial<Player> = { xp: newXP };
    if (newLevel > player.level) {
      updates.level = newLevel;
      toast({
        title: "¡SUBISTE DE NIVEL!",
        description: `¡Has alcanzado el Nivel ${newLevel}!`,
        variant: 'default',
      });
    }
    try {
      await updateDoc(playerDocRef, updates as any); 
    } catch (error) {
      console.error("Error actualizando XP:", error);
      toast({ title: "Error", description: "No se pudo actualizar el XP.", variant: "destructive" });
    }
  }, [player, userId, toast]);

  const updatePlayerStats = useCallback(async (statName: string, valueChange: number) => {
    if (!userId || !player) return;
    if (!player.stats.hasOwnProperty(statName)) {
        console.warn(`Intento de actualizar un stat inexistente: ${statName}`);
        toast({ title: "Error de Atributo", description: `El atributo "${statName}" no existe para este personaje.`, variant: "destructive" });
        return;
    }
    const playerDocRef = doc(db, 'players', userId);
    const currentStatValue = player.stats[statName] || 0;
    const newStatValue = Math.max(0, currentStatValue + valueChange); // Asegura que no sea negativo
    try {
      await updateDoc(playerDocRef, {
        [`stats.${statName}`]: newStatValue,
      });
       toast({ title: "¡Atributo Actualizado!", description: `${statName} cambió en ${valueChange}. Nuevo valor: ${newStatValue}`});
    } catch (error) {
      console.error("Error actualizando stats del jugador:", error);
      toast({ title: "Error", description: "No se pudieron actualizar los atributos del jugador.", variant: "destructive" });
    }
  }, [player, userId, toast]);

  const updatePlayerProfileAfterQuiz = async (quizData: Partial<Player>) => {
    if (!userId) {
      toast({ title: "Error de Usuario", description: "No se encontró el usuario.", variant: "destructive"});
      return;
    }
    const playerDocRef = doc(db, 'players', userId);
    try {
      await updateDoc(playerDocRef, { ...quizData, hasCompletedQuiz: true });
      toast({ title: "¡Perfil Actualizado!", description: "Tu aventura personalizada comienza ahora.", variant: "default" });
      // La redirección al dashboard ocurrirá automáticamente por el AppLayout
    } catch (error) {
        console.error("Error guardando datos del quiz:", error);
        toast({ title: "Error al Guardar", description: "No se pudieron guardar los datos del quiz.", variant: "destructive"});
    }
  };


  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'status'>) => {
    if (!userId) {
      toast({ title: "No Autenticado", description: "Debes iniciar sesión para añadir misiones.", variant: "destructive"});
      return;
    }
    const taskColRef = collection(db, 'players', userId, 'tasks');
    try {
      const newTaskPayload: any = {
        ...taskData,
        status: 'To Do',
        createdAt: Timestamp.now(),
      };
      if (taskData.dueDate) {
        newTaskPayload.dueDate = Timestamp.fromDate(new Date(taskData.dueDate));
      }
      await addDoc(taskColRef, newTaskPayload);
      toast({ title: "¡Misión Añadida!", description: `"${taskData.title}" ahora está en tu lista.`, variant: 'default' });
    } catch (error) {
      console.error("Error añadiendo misión:", error);
      toast({ title: "Error", description: "No se pudo añadir la misión.", variant: "destructive" });
    }
  };

  const updateTask = async (taskId: string, taskData: Partial<Omit<Task, 'id' | 'createdAt'>>) => {
    if (!userId) return;
    const taskDocRef = doc(db, 'players', userId, 'tasks', taskId);
    try {
      const updatePayload: any = { ...taskData };
      if (taskData.dueDate) {
        updatePayload.dueDate = Timestamp.fromDate(new Date(taskData.dueDate));
      } else if (taskData.hasOwnProperty('dueDate') && taskData.dueDate === undefined) {
         updatePayload.dueDate = null; 
      }

      await updateDoc(taskDocRef, updatePayload);
      toast({ title: "¡Misión Actualizada!", variant: 'default' });
    } catch (error) {
      console.error("Error actualizando misión:", error);
      toast({ title: "Error", description: "No se pudo actualizar la misión.", variant: "destructive" });
    }
  };

  const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
    if (!userId) return;
    const taskDocRef = doc(db, 'players', userId, 'tasks', taskId);
    try {
      const taskSnap = await getDoc(taskDocRef);
      if (taskSnap.exists()) {
        const taskData = taskSnap.data();
        const task = { id: taskSnap.id, ...taskData } as Task;
        
        if (status === 'Done' && task.status !== 'Done') {
          addXP(task.xpReward);
           toast({ title: "¡Misión Completada!", description: `Ganaste ${task.xpReward} XP. Estado: ${status}.` });
        } else {
           toast({ title: "Estado de Misión Actualizado", description: `Misión marcada como ${status}.` });
        }
        await updateDoc(taskDocRef, { status });
      }
    } catch (error) {
      console.error("Error actualizando estado de misión:", error);
      toast({ title: "Error", description: "No se pudo actualizar el estado de la misión.", variant: "destructive" });
    }
  };
  
  const deleteTask = async (taskId: string) => {
    if (!userId) return;
    const taskDocRef = doc(db, 'players', userId, 'tasks', taskId);
    try {
      await deleteDoc(taskDocRef);
      toast({ title: "Misión Abandonada.", variant: 'destructive' });
    } catch (error) {
      console.error("Error eliminando misión:", error);
      toast({ title: "Error", description: "No se pudo abandonar la misión.", variant: "destructive" });
    }
  };

  const addHabit = async (habitData: Omit<Habit, 'id' | 'createdAt' | 'currentStreak' | 'longestStreak' | 'lastCompletedDate'>) => {
    if (!userId) {
      toast({ title: "No Autenticado", description: "Debes iniciar sesión para añadir disciplinas.", variant: "destructive"});
      return;
    }
    // Validar que targetStat (si existe) sea uno de los stats del jugador
    if (habitData.targetStat && player && !player.stats.hasOwnProperty(habitData.targetStat)) {
        toast({ title: "Atributo Inválido", description: `El atributo "${habitData.targetStat}" no es válido para tu personaje.`, variant: "destructive"});
        return;
    }

    const habitColRef = collection(db, 'players', userId, 'habits');
    try {
      await addDoc(habitColRef, {
        ...habitData,
        currentStreak: 0,
        longestStreak: 0,
        createdAt: Timestamp.now(),
      });
      toast({ title: "¡Disciplina Establecida!", description: `Nueva disciplina "${habitData.title}" forjada.` });
    } catch (error) {
      console.error("Error añadiendo disciplina:", error);
      toast({ title: "Error", description: "No se pudo establecer la disciplina.", variant: "destructive" });
    }
  };

  const updateHabit = async (habitId: string, habitData: Partial<Omit<Habit, 'id' | 'createdAt'>>) => {
     if (!userId) return;
     // Validar que targetStat (si existe y se está cambiando) sea uno de los stats del jugador
    if (habitData.targetStat && player && !player.stats.hasOwnProperty(habitData.targetStat)) {
        toast({ title: "Atributo Inválido", description: `El atributo "${habitData.targetStat}" no es válido para tu personaje.`, variant: "destructive"});
        return;
    }
    const habitDocRef = doc(db, 'players', userId, 'habits', habitId);
    try {
      await updateDoc(habitDocRef, habitData as any); 
      toast({ title: "¡Disciplina Actualizada!", variant: 'default' });
    } catch (error) {
      console.error("Error actualizando disciplina:", error);
      toast({ title: "Error", description: "No se pudo actualizar la disciplina.", variant: "destructive" });
    }
  };

  const completeHabit = async (habitId: string) => {
    if (!userId || !player) return;
    const habitDocRef = doc(db, 'players', userId, 'habits', habitId);
    
    try {
      const habitSnap = await getDoc(habitDocRef);
      if (!habitSnap.exists()) {
        toast({ title: "Error", description: "Disciplina no encontrada.", variant: "destructive" });
        return;
      }

      const habitDataFS = habitSnap.data();
      const habit: Habit = {
        id: habitSnap.id,
        ...habitDataFS,
        createdAt: (habitDataFS.createdAt as Timestamp).toDate().toISOString(),
        lastCompletedDate: habitDataFS.lastCompletedDate ? (habitDataFS.lastCompletedDate as Timestamp).toDate().toISOString().split('T')[0] : undefined,
      } as Habit;

      const today = new Date().toISOString().split('T')[0];
      
      if (habit.frequency === 'Daily' && habit.lastCompletedDate === today) {
        toast({ title: "¡Ya Cumpliste!", description: "Ya completaste esta disciplina diaria hoy.", variant: "default"});
        return;
      }

      const newStreak = (habit.type === 'Good' ? (habit.currentStreak || 0) + 1 : 0);
      const newLongestStreak = Math.max(habit.longestStreak || 0, newStreak);
      
      await updateDoc(habitDocRef, {
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        lastCompletedDate: Timestamp.fromDate(new Date()), 
      });

      if (habit.type === 'Good' && habit.targetStat && habit.statImprovementValue) {
        // El nombre del stat viene de habit.targetStat
        await updatePlayerStats(habit.targetStat, habit.statImprovementValue);
      } else {
         toast({ title: "¡Disciplina Honrada!", description: `Disciplina completada. Racha: ${newStreak}.`, variant: "default" });
      }

    } catch (error) {
      console.error("Error completando disciplina:", error);
      toast({ title: "Error", description: "No se pudo completar la disciplina.", variant: "destructive" });
    }
  };

  const deleteHabit = async (habitId: string) => {
    if (!userId) return;
    const habitDocRef = doc(db, 'players', userId, 'habits', habitId);
    try {
      await deleteDoc(habitDocRef);
      toast({ title: "Disciplina Abandonada.", variant: 'destructive' });
    } catch (error) {
      console.error("Error eliminando disciplina:", error);
      toast({ title: "Error", description: "No se pudo abandonar la disciplina.", variant: "destructive" });
    }
  };

  return (
    <LifeQuestContext.Provider value={{ 
      player, 
      tasks, 
      habits, 
      isLoading,
      addTask, 
      updateTask, 
      updateTaskStatus, 
      deleteTask, 
      addHabit, 
      updateHabit, 
      completeHabit, 
      deleteHabit,
      updatePlayerProfileAfterQuiz
    }}>
      {children}
    </LifeQuestContext.Provider>
  );
};

export const useLifeQuest = () => {
  const context = useContext(LifeQuestContext);
  if (context === undefined) {
    throw new Error('useLifeQuest must be used within a LifeQuestProvider');
  }
  return context;
};
