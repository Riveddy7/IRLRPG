
"use client";

import type { Player, PlayerStats, Task, Habit, TaskStatus, Difficulty, PlayerSkill } from '@/types';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  MAX_LEVEL as MAX_PLAYER_LEVEL,
  getXPForLevel,
  getLevelFromXP as getPlayerLevelFromXP,
  XP_PER_SKILL_LEVEL,
  MAX_SKILL_LEVEL,
  getSkillLevelFromXP,
  HABIT_REWARDS,
  TASK_REWARDS,
} from '@/config/game-config';
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
  writeBatch,
} from 'firebase/firestore';
import { useAuth } from './use-auth';
import { format, startOfDay } from 'date-fns';

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
        console.warn(`Player document for UID ${userId} does not exist.`);
        setPlayer(null);
      }
    }, (error) => {
      console.error(`Error fetching player data for UID ${userId}:`, error);
      toast({ title: "Error", description: "No se pudieron cargar los datos del jugador.", variant: "destructive" });
      setPlayer(null);
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
    }, (error) => console.error(`Error fetching tasks for UID ${userId}:`, error));

    const habitsQuery = query(collection(db, 'players', userId, 'habits'));
    const unsubscribeHabits = onSnapshot(habitsQuery, (querySnapshot) => {
      const habitsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        // Ensure lastCompletedDate is correctly formatted as YYYY-MM-DD string or undefined
        let lastCompletedDateStr: string | undefined = undefined;
        if (data.lastCompletedDate) {
          if (data.lastCompletedDate instanceof Timestamp) {
            lastCompletedDateStr = format(data.lastCompletedDate.toDate(), 'yyyy-MM-dd');
          } else if (typeof data.lastCompletedDate === 'string') {
            // If it's already a string, try to parse and reformat to ensure consistency, or use as is if valid
            try {
              lastCompletedDateStr = format(new Date(data.lastCompletedDate), 'yyyy-MM-dd');
            } catch (e) {
              // If parsing fails, and it looks like YYYY-MM-DD, use it. Otherwise, problematic.
              if (/^\d{4}-\d{2}-\d{2}$/.test(data.lastCompletedDate)) {
                 lastCompletedDateStr = data.lastCompletedDate;
              } else {
                console.warn("Invalid lastCompletedDate string format:", data.lastCompletedDate);
              }
            }
          }
        }
        return {
          id: doc.id,
          ...data,
          createdAt: (data.createdAt as Timestamp)?.toDate().toISOString(),
          lastCompletedDate: lastCompletedDateStr,
        } as Habit;
      });
      setHabits(habitsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }, (error) => console.error(`Error fetching habits for UID ${userId}:`, error));

    const checkInitialLoad = async () => {
      try {
        if (userId) await getDoc(playerDocRef);
      } catch (e) { /* Error already handled by onSnapshot */ }
      finally {
        if (!authIsLoading) setIsLoading(false);
      }
    };
    checkInitialLoad();

    return () => {
      unsubscribePlayer();
      unsubscribeTasks();
      unsubscribeHabits();
    };
  }, [userId, authIsLoading, toast]);

  const updatePlayerProfileAfterQuiz = async (quizData: Partial<Player>) => {
    if (!userId) {
      toast({ title: "Error de Usuario", description: "No se encontró el usuario.", variant: "destructive" });
      return;
    }
    const playerDocRef = doc(db, 'players', userId);

    const initialStats: PlayerStats = {};
    if (quizData.stats) {
      for (const statName in quizData.stats) {
        initialStats[statName] = { xp: 0, level: 1 };
      }
    }

    const profileToUpdate: Partial<Player> = {
      ...quizData,
      stats: initialStats, // Ensure stats are initialized with xp and level
      xp: 0,
      level: 1,
      coins: 0,
      hasCompletedQuiz: true
    };

    try {
      await updateDoc(playerDocRef, profileToUpdate);
      toast({ title: "¡Perfil Actualizado!", description: "Tu aventura personalizada comienza ahora.", variant: "default" });
    } catch (error) {
      console.error("Error guardando datos del quiz:", error);
      toast({ title: "Error al Guardar", description: "No se pudieron guardar los datos del quiz.", variant: "destructive" });
    }
  };

  const addPlayerXPAndCoins = useCallback(async (xpAmount: number, coinAmount: number, targetStatName?: string, skillXpAmount?: number) => {
    if (!userId || !player) return;

    const batch = writeBatch(db);
    const playerDocRef = doc(db, 'players', userId);

    // Fetch the latest player data directly from Firestore within the transaction/batch context if possible
    // For simplicity here, we use the current state `player`, assuming it's reasonably up-to-date
    // or that Firestore rules/security handle concurrency if critical.
    // A more robust solution for critical ops might involve Firestore Transactions.

    let newPlayerXP = player.xp + xpAmount;
    let newPlayerLevel = player.level;

    if (xpAmount > 0) {
        newPlayerLevel = getPlayerLevelFromXP(newPlayerXP);
    } else {
        // Prevent XP from dropping below the minimum for the current level, unless leveling down
        const currentLevelMinXp = getXPForLevel(player.level);
        newPlayerXP = Math.max(currentLevelMinXp, newPlayerXP); // Don't drop XP below current level's min
        newPlayerLevel = getPlayerLevelFromXP(newPlayerXP); // Recalculate level
    }
    newPlayerLevel = Math.max(1, newPlayerLevel); // Ensure player level doesn't go below 1
    newPlayerXP = Math.max(0, newPlayerXP); // Ensure player XP doesn't go below 0


    const playerUpdates: Partial<Player> = {
      xp: newPlayerXP,
      coins: Math.max(0, (player.coins || 0) + coinAmount),
    };

    if (newPlayerLevel > player.level) {
      playerUpdates.level = newPlayerLevel;
      toast({ title: "¡SUBISTE DE NIVEL!", description: `¡Has alcanzado el Nivel ${newPlayerLevel}!`, variant: "default" });
    } else if (newPlayerLevel < player.level && player.level > 1) {
      playerUpdates.level = newPlayerLevel;
       toast({ title: "Nivel Perdido", description: `Has bajado al Nivel ${newPlayerLevel}.`, variant: "destructive" });
    }


    if (targetStatName && skillXpAmount !== undefined && player.stats && player.stats[targetStatName]) {
      const currentSkillData = player.stats[targetStatName];
      let newTotalSkillXP = currentSkillData.xp + skillXpAmount;
      newTotalSkillXP = Math.max(0, newTotalSkillXP); // Ensure skill XP doesn't go below 0

      let newSkillLevel = getSkillLevelFromXP(newTotalSkillXP);
      newSkillLevel = Math.max(1, newSkillLevel); // Ensure skill level doesn't go below 1

      playerUpdates.stats = {
        ...player.stats,
        [targetStatName]: { xp: newTotalSkillXP, level: newSkillLevel },
      };

      if (newSkillLevel > currentSkillData.level) {
        toast({ title: `¡${targetStatName} Subió de Nivel!`, description: `Tu skill ${targetStatName} es ahora Nivel ${newSkillLevel}.`, variant: "default" });
      } else if (newSkillLevel < currentSkillData.level && currentSkillData.level > 1) {
         toast({ title: `¡${targetStatName} Bajó de Nivel!`, description: `Tu skill ${targetStatName} es ahora Nivel ${newSkillLevel}.`, variant: "destructive" });
      }
    }

    batch.update(playerDocRef, playerUpdates as any);

    try {
      await batch.commit();
    } catch (error) {
      console.error("Error actualizando XP y monedas:", error);
      toast({ title: "Error", description: "No se pudo actualizar XP/monedas.", variant: "destructive" });
    }
  }, [player, userId, toast]);

  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'status'>) => {
    if (!userId) {
      toast({ title: "No Autenticado", description: "Debes iniciar sesión.", variant: "destructive" });
      return;
    }
    const taskColRef = collection(db, 'players', userId, 'tasks');
    try {
      const newTaskPayload: any = {
        ...taskData,
        status: 'To Do',
        createdAt: Timestamp.now(),
      };
      if (taskData.dueDate) newTaskPayload.dueDate = Timestamp.fromDate(new Date(taskData.dueDate));
      await addDoc(taskColRef, newTaskPayload);
      toast({ title: "¡Misión Añadida!", description: `"${taskData.title}" en tu lista.`, variant: 'default' });
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
    if (!userId || !player) return;
    const taskDocRef = doc(db, 'players', userId, 'tasks', taskId);
    try {
      const taskSnap = await getDoc(taskDocRef);
      if (taskSnap.exists()) {
        const task = { id: taskSnap.id, ...taskSnap.data() } as Task;

        if (status === 'Done' && task.status !== 'Done') {
          const rewards = task.difficulty === 'Easy' ? TASK_REWARDS.EASY : TASK_REWARDS.HARD;
          await addPlayerXPAndCoins(rewards.XP, rewards.COINS, task.targetStat, rewards.XP);
          toast({ title: "¡Misión Completada!", description: `Ganaste ${rewards.XP} XP y ${rewards.COINS} monedas.` });
        } else {
          toast({ title: "Estado de Misión Actualizado", description: `Misión marcada como ${status}.` });
        }
        await updateDoc(taskDocRef, { status });
      }
    } catch (error)
    {
      console.error("Error actualizando estado de misión:", error);
      toast({ title: "Error", description: "No se pudo actualizar el estado.", variant: "destructive" });
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
    if (!userId || !player) {
      toast({ title: "No Autenticado", description: "Debes iniciar sesión.", variant: "destructive" });
      return;
    }
    if (habitData.targetStat && player.stats && !player.stats.hasOwnProperty(habitData.targetStat)) {
      toast({ title: "Atributo Inválido", description: `El atributo "${habitData.targetStat}" no es válido.`, variant: "destructive" });
      return;
    }
    const habitColRef = collection(db, 'players', userId, 'habits');
    try {
      await addDoc(habitColRef, {
        ...habitData,
        currentStreak: 0,
        longestStreak: 0,
        createdAt: Timestamp.now(),
        // lastCompletedDate is initially undefined
      });
      toast({ title: "¡Disciplina Establecida!", description: `Disciplina "${habitData.title}" forjada.` });
    } catch (error) {
      console.error("Error añadiendo disciplina:", error);
      toast({ title: "Error", description: "No se pudo establecer la disciplina.", variant: "destructive" });
    }
  };

  const updateHabit = async (habitId: string, habitData: Partial<Omit<Habit, 'id' | 'createdAt'>>) => {
    if (!userId || !player) return;
    if (habitData.targetStat && player.stats && !player.stats.hasOwnProperty(habitData.targetStat)) {
      toast({ title: "Atributo Inválido", description: `El atributo "${habitData.targetStat}" no es válido.`, variant: "destructive" });
      return;
    }
    const habitDocRef = doc(db, 'players', userId, 'habits', habitId);
    try {
      await updateDoc(habitDocRef, habitData as any);
      toast({ title: "¡Disciplina Actualizada!", variant: 'default' });
    } catch (error) {
      console.error("Error actualizando disciplina:", error);
      toast({ title: "Error", description: "No se pudo actualizar.", variant: "destructive" });
    }
  };

  const completeHabit = async (habitId: string) => {
    if (!userId || !player) return;
    const habitDocRef = doc(db, 'players', userId, 'habits', habitId);

    try {
      // Get the most recent habit data directly from Firestore
      const habitSnap = await getDoc(habitDocRef);
      if (!habitSnap.exists()) {
        toast({ title: "Error", description: "Disciplina no encontrada.", variant: "destructive" });
        return;
      }

      // Convert Firestore data to Habit type, ensuring lastCompletedDate is a YYYY-MM-DD string
      const firestoreData = habitSnap.data();
      let lastCompletedDateStr: string | undefined = undefined;
      if (firestoreData.lastCompletedDate) {
        if (firestoreData.lastCompletedDate instanceof Timestamp) {
          lastCompletedDateStr = format(firestoreData.lastCompletedDate.toDate(), 'yyyy-MM-dd');
        } else if (typeof firestoreData.lastCompletedDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(firestoreData.lastCompletedDate) ) {
           lastCompletedDateStr = firestoreData.lastCompletedDate;
        }
      }
      const habit: Habit = {
          id: habitSnap.id,
          ...firestoreData,
          createdAt: (firestoreData.createdAt as Timestamp)?.toDate().toISOString(),
          lastCompletedDate: lastCompletedDateStr,
      } as Habit;


      const todayString = format(startOfDay(new Date()), 'yyyy-MM-dd');

      if (habit.type === 'Good' && habit.frequency === 'Daily' && habit.lastCompletedDate === todayString) {
        toast({ title: "¡Ya Cumpliste!", description: "Ya completaste esta disciplina diaria hoy." });
        return; // Already completed today
      }

      let newStreak = habit.currentStreak || 0;
      let rewards;
      let skillXpChange;

      if (habit.type === 'Good') {
        newStreak++;
        rewards = habit.difficulty === 'Easy' ? HABIT_REWARDS.GOOD.EASY : HABIT_REWARDS.GOOD.HARD;
        skillXpChange = rewards.XP;
      } else { // Bad habit
        newStreak = 0; // Reset streak for bad habits when they occur
        rewards = habit.difficulty === 'Easy' ? HABIT_REWARDS.BAD.EASY : HABIT_REWARDS.BAD.HARD;
        skillXpChange = rewards.XP;
      }

      const newLongestStreak = Math.max(habit.longestStreak || 0, newStreak);

      // Update Firestore
      // We use setDoc here to ensure lastCompletedDate is explicitly set or removed.
      // Alternatively, can use updateDoc and explicitly set lastCompletedDate to the Timestamp or delete it if needed.
      await updateDoc(habitDocRef, {
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        lastCompletedDate: Timestamp.fromDate(startOfDay(new Date())), // Store as Firestore Timestamp
      });

      await addPlayerXPAndCoins(rewards.XP, rewards.COINS, habit.targetStat, skillXpChange);

      const xpAbs = Math.abs(rewards.XP);
      const actionText = rewards.XP >= 0 ? `Ganaste ${xpAbs} XP` : `Perdiste ${xpAbs} XP`;
      toast({ title: `¡Disciplina ${habit.type === 'Good' ? 'Honrada' : 'Registrada'}!`, description: `${actionText}, ${rewards.COINS} monedas. Racha: ${newStreak}.` });

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
      toast({ title: "Error", description: "No se pudo abandonar.", variant: "destructive" });
    }
  };

  return (
    <LifeQuestContext.Provider value={{
      player, tasks, habits, isLoading,
      addTask, updateTask, updateTaskStatus, deleteTask,
      addHabit, updateHabit, completeHabit, deleteHabit,
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

