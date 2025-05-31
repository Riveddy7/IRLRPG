
"use client";

import type { Player, PlayerStats, Task, Habit, TaskStatus, Difficulty, PlayerSkill, RewardItem } from '@/types';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  // MAX_PLAYER_LEVEL, // Not used directly, MAX_LEVEL from config is used
  getXPForLevel, 
  getLevelFromXP,
  // XP_PER_SKILL_LEVEL, // Not used directly, MAX_SKILL_LEVEL and getSkillLevelFromXP are enough
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
  orderBy,
} from 'firebase/firestore';
import { useAuth } from './use-auth';
import { format, startOfDay, subDays, isEqual } from 'date-fns'; 

interface LifeQuestContextType {
  player: Player | null;
  tasks: Task[];
  habits: Habit[];
  rewards: RewardItem[];
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
  addReward: (rewardData: Omit<RewardItem, 'id' | 'createdAt'>) => Promise<void>;
  updateReward: (rewardId: string, rewardData: Partial<Omit<RewardItem, 'id' | 'createdAt'>>) => Promise<void>;
  deleteReward: (rewardId: string) => Promise<void>;
  purchaseReward: (rewardId: string) => Promise<void>;
}

const LifeQuestContext = createContext<LifeQuestContextType | undefined>(undefined);

export const LifeQuestProvider = ({ children }: { children: ReactNode }) => {
  const { user, isLoading: authIsLoading } = useAuth();
  const [player, setPlayer] = useState<Player | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [rewards, setRewards] = useState<RewardItem[]>([]);
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
      setRewards([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const playerDocRef = doc(db, 'players', userId);

    const unsubscribePlayer = onSnapshot(playerDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setPlayer(docSnap.data() as Player);
      } else {
        console.warn(`Documento de jugador para UID ${userId} no existe.`);
        setPlayer(null);
      }
    }, (error) => {
      console.error(`Error obteniendo datos del jugador para UID ${userId}:`, error);
      toast({ title: "Error", description: "No se pudieron cargar los datos del jugador.", variant: "destructive" });
      setPlayer(null);
    });

    const tasksQuery = query(collection(db, 'players', userId, 'tasks'), orderBy('createdAt', 'desc'));
    const unsubscribeTasks = onSnapshot(tasksQuery, (querySnapshot) => {
      const tasksData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: (data.createdAt as Timestamp)?.toDate().toISOString(),
          dueDate: data.dueDate ? (data.dueDate instanceof Timestamp ? data.dueDate.toDate().toISOString() : new Date(data.dueDate).toISOString()) : undefined,
        } as Task;
      });
      setTasks(tasksData);
    }, (error) => console.error(`Error obteniendo tareas para UID ${userId}:`, error));

    const habitsQuery = query(collection(db, 'players', userId, 'habits'), orderBy('createdAt', 'desc'));
    const unsubscribeHabits = onSnapshot(habitsQuery, (querySnapshot) => {
      const habitsData = querySnapshot.docs.map(docSnap => { 
        const data = docSnap.data();
        let lastCompletedDateStr: string | undefined = undefined;
        if (data.lastCompletedDate) {
          if (data.lastCompletedDate instanceof Timestamp) {
            lastCompletedDateStr = format(startOfDay(data.lastCompletedDate.toDate()), 'yyyy-MM-dd');
          } else if (typeof data.lastCompletedDate === 'string') {
            try {
              lastCompletedDateStr = format(startOfDay(new Date(data.lastCompletedDate)), 'yyyy-MM-dd');
            } catch (e) {
              if (/^\d{4}-\d{2}-\d{2}$/.test(data.lastCompletedDate)) {
                 lastCompletedDateStr = data.lastCompletedDate;
              } else {
                console.warn("Formato de cadena lastCompletedDate inválido en hábito:", data.lastCompletedDate, "para ID de hábito:", docSnap.id);
              }
            }
          }
        }
        return {
          id: docSnap.id,
          ...data,
          createdAt: (data.createdAt as Timestamp)?.toDate().toISOString(),
          lastCompletedDate: lastCompletedDateStr,
        } as Habit;
      });
      setHabits(habitsData);
    }, (error) => console.error(`Error obteniendo hábitos para UID ${userId}:`, error));

    const rewardsQuery = query(collection(db, 'players', userId, 'rewards'), orderBy('createdAt', 'desc'));
    const unsubscribeRewards = onSnapshot(rewardsQuery, (querySnapshot) => {
      const rewardsData = querySnapshot.docs.map(doc => { 
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: (data.createdAt as Timestamp)?.toDate().toISOString(),
        } as RewardItem;
      });
      setRewards(rewardsData);
    }, (error) => console.error(`Error obteniendo recompensas para UID ${userId}:`, error));


    const checkInitialLoad = async () => {
      try {
        if (userId) await getDoc(playerDocRef);
      } catch (e) { /* Error ya manejado por onSnapshot */ }
      finally {
        if (!authIsLoading) setIsLoading(false);
      }
    };
    checkInitialLoad();

    return () => {
      unsubscribePlayer();
      unsubscribeTasks();
      unsubscribeHabits();
      unsubscribeRewards();
    };
  }, [userId, authIsLoading, toast]);

  const updatePlayerProfileAfterQuiz = async (quizData: Partial<Player>) => {
    if (!userId) {
      toast({ title: "Error de Usuario", description: "No se encontró el usuario.", variant: "destructive" });
      return;
    }
    const playerDocRef = doc(db, 'players', userId);

    const initialPlayerStats: PlayerStats = {};
    if (quizData.stats) {
        for (const statName in quizData.stats) {
            initialPlayerStats[statName] = { xp: 0, level: 1 };
        }
    }
    
    const profileToUpdate: Partial<Player> = {
      ...quizData,
      stats: initialPlayerStats,
      xp: 0, 
      level: 1,
      coins: 0,
      hasCompletedQuiz: true
    };

    try {
      await updateDoc(playerDocRef, profileToUpdate);
      toast({ title: "¡Perfil Actualizado!", description: "Tu aventura personalizada comienza ahora.", variant: "default" });
    } catch (error) {
      console.error("Error guardando datos del perfil inicial:", error);
      toast({ title: "Error al Guardar", description: "No se pudieron guardar los datos del perfil inicial.", variant: "destructive" });
    }
  };

  const addPlayerXPAndCoins = useCallback(async (xpAmount: number, coinAmount: number, targetStatName?: string, skillXpAmount?: number) => {
    if (!userId || !player) return;

    const batch = writeBatch(db);
    const playerDocRef = doc(db, 'players', userId);

    let newPlayerXP = player.xp + xpAmount;
    let newPlayerLevel = player.level;

    if (xpAmount > 0) {
        newPlayerLevel = getLevelFromXP(newPlayerXP);
    } else {
        const currentLevelMinXp = getXPForLevel(player.level);
        newPlayerXP = Math.max(currentLevelMinXp, newPlayerXP); 
        newPlayerLevel = getLevelFromXP(newPlayerXP); 
    }
    newPlayerLevel = Math.max(1, newPlayerLevel); 
    newPlayerXP = Math.max(0, newPlayerXP);


    const playerUpdates: Partial<Player> = {
      xp: newPlayerXP,
      coins: Math.max(0, (player.coins || 0) + coinAmount),
    };

    if (newPlayerLevel !== player.level) {
      playerUpdates.level = newPlayerLevel;
      if (newPlayerLevel > player.level) {
        toast({ title: "¡SUBISTE DE NIVEL!", description: `¡Has alcanzado el Nivel ${newPlayerLevel}!`, variant: "default" });
      } else if (newPlayerLevel < player.level) {
         toast({ title: "Nivel Perdido", description: `Has bajado al Nivel ${newPlayerLevel}.`, variant: "destructive" });
      }
    }


    if (targetStatName && skillXpAmount !== undefined && player.stats && player.stats[targetStatName]) {
      const currentSkillData = player.stats[targetStatName];
      let newTotalSkillXP = currentSkillData.xp + skillXpAmount;
      newTotalSkillXP = Math.max(0, newTotalSkillXP); 

      let newSkillLevel = getSkillLevelFromXP(newTotalSkillXP);
      newSkillLevel = Math.max(1, newSkillLevel); 


      playerUpdates.stats = {
        ...player.stats,
        [targetStatName]: { xp: newTotalSkillXP, level: newSkillLevel },
      };

      if (newSkillLevel !== currentSkillData.level) {
        if (newSkillLevel > currentSkillData.level) {
          toast({ title: `¡Atributo '${targetStatName}' Subió de Nivel!`, description: `Tu atributo ${targetStatName} es ahora Nivel ${newSkillLevel}.`, variant: "default" });
        } else if (newSkillLevel < currentSkillData.level) {
           toast({ title: `¡Atributo '${targetStatName}' Bajó de Nivel!`, description: `Tu atributo ${targetStatName} es ahora Nivel ${newSkillLevel}.`, variant: "destructive" });
        }
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
      toast({ title: "¡Objetivo Añadido!", description: `"${taskData.title}" en tu lista.`, variant: 'default' });
    } catch (error) {
      console.error("Error añadiendo objetivo:", error);
      toast({ title: "Error", description: "No se pudo añadir el objetivo.", variant: "destructive" });
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
      toast({ title: "¡Objetivo Actualizado!", variant: 'default' });
    } catch (error) {
      console.error("Error actualizando objetivo:", error);
      toast({ title: "Error", description: "No se pudo actualizar el objetivo.", variant: "destructive" });
    }
  };

  const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
    if (!userId || !player) return;
    const taskDocRef = doc(db, 'players', userId, 'tasks', taskId);
    try {
      const taskSnap = await getDoc(taskDocRef);
      if (taskSnap.exists()) {
        const taskData = taskSnap.data();
        const task = { 
            id: taskSnap.id, 
            ...taskData,
            createdAt: taskData.createdAt instanceof Timestamp ? taskData.createdAt.toDate().toISOString() : taskData.createdAt,
            dueDate: taskData.dueDate instanceof Timestamp ? taskData.dueDate.toDate().toISOString() : taskData.dueDate,
        } as Task;


        if (status === 'Done' && task.status !== 'Done') {
          const rewards = task.difficulty === 'Easy' ? TASK_REWARDS.EASY : TASK_REWARDS.HARD;
          await addPlayerXPAndCoins(rewards.XP, rewards.COINS, task.targetStat, rewards.XP);
          toast({ title: "¡Objetivo Completado!", description: `Ganaste ${rewards.XP} XP y ${rewards.COINS} monedas.` });
        } else {
          toast({ title: "Estado de Objetivo Actualizado", description: `Objetivo marcado como ${status}.` });
        }
        await updateDoc(taskDocRef, { status });
      }
    } catch (error)
    {
      console.error("Error actualizando estado de objetivo:", error);
      toast({ title: "Error", description: "No se pudo actualizar el estado.", variant: "destructive" });
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!userId) return;
    const taskDocRef = doc(db, 'players', userId, 'tasks', taskId);
    try {
      await deleteDoc(taskDocRef);
      toast({ title: "Objetivo Eliminado.", variant: 'destructive' });
    } catch (error) {
      console.error("Error eliminando objetivo:", error);
      toast({ title: "Error", description: "No se pudo eliminar el objetivo.", variant: "destructive" });
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
        lastCompletedDate: null, 
        createdAt: Timestamp.now(),
      });
      toast({ title: "¡Disciplina Establecida!", description: `Disciplina "${habitData.title}" lista.` });
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
      const updatePayload = {...habitData};
      if (habitData.hasOwnProperty('lastCompletedDate') && (habitData.lastCompletedDate === null || habitData.lastCompletedDate === undefined)) {
        (updatePayload as any).lastCompletedDate = null;
      } else if (habitData.lastCompletedDate) {
        try {
          (updatePayload as any).lastCompletedDate = Timestamp.fromDate(startOfDay(new Date(habitData.lastCompletedDate)));
        } catch (e) {
            console.warn("No se pudo convertir la cadena lastCompletedDate a Timestamp durante la actualización:", habitData.lastCompletedDate);
            delete (updatePayload as any).lastCompletedDate; 
        }
      }

      await updateDoc(habitDocRef, updatePayload as any);
      toast({ title: "¡Disciplina Actualizada!", variant: 'default' });
    } catch (error) {
      console.error("Error actualizando disciplina:", error);
      toast({ title: "Error", description: "No se pudo actualizar.", variant: "destructive" });
    }
  };

  const completeHabit = async (habitId: string) => {
    if (!userId || !player) return;
    const habitDocRef = doc(db, 'players', userId, 'habits', habitId);
    const today = new Date();
    const todayString = format(startOfDay(today), 'yyyy-MM-dd');

    try {
      const habitSnap = await getDoc(habitDocRef);
      if (!habitSnap.exists()) {
        toast({ title: "Error", description: "Disciplina no encontrada.", variant: "destructive" });
        return;
      }

      const firestoreData = habitSnap.data();
      let habitLastCompletedDate: Date | null = null;
      if (firestoreData.lastCompletedDate instanceof Timestamp) {
        habitLastCompletedDate = startOfDay(firestoreData.lastCompletedDate.toDate());
      } else if (typeof firestoreData.lastCompletedDate === 'string') {
        try {
            habitLastCompletedDate = startOfDay(new Date(firestoreData.lastCompletedDate));
        } catch (e) { /* ya logueado en onSnapshot */ }
      }
      
      const habit: Habit = {
          id: habitSnap.id,
          ...firestoreData,
          createdAt: (firestoreData.createdAt as Timestamp)?.toDate().toISOString(),
          lastCompletedDate: habitLastCompletedDate ? format(habitLastCompletedDate, 'yyyy-MM-dd') : undefined,
      } as Habit;

      let newStreak = habit.currentStreak || 0;
      let rewards;
      let skillXpChange;
      let newLastCompletedDate: Timestamp | null = Timestamp.fromDate(startOfDay(today));
      let toastTitle = "";
      let toastDescription = "";

      if (habit.type === 'Good' && habit.frequency === 'Daily' && habit.lastCompletedDate === todayString) {
        rewards = habit.difficulty === 'Easy' ? HABIT_REWARDS.GOOD.EASY : HABIT_REWARDS.GOOD.HARD;
        skillXpChange = -rewards.XP; 
        const coinChange = -rewards.COINS; 

        newStreak = Math.max(0, newStreak - 1);
        newLastCompletedDate = null; 
        await addPlayerXPAndCoins(skillXpChange, coinChange, habit.targetStat, skillXpChange);
        toastTitle = "Disciplina Desmarcada";
        toastDescription = `Se revirtieron ${Math.abs(skillXpChange)} XP y ${Math.abs(coinChange)} monedas. Racha: ${newStreak}.`;

      } else if (habit.type === 'Bad') {
        newStreak = 0; 
        rewards = habit.difficulty === 'Easy' ? HABIT_REWARDS.BAD.EASY : HABIT_REWARDS.BAD.HARD;
        skillXpChange = rewards.XP; 
        newLastCompletedDate = Timestamp.fromDate(startOfDay(today)); 
        await addPlayerXPAndCoins(skillXpChange, rewards.COINS, habit.targetStat, skillXpChange);
        toastTitle = "Mal Hábito Registrado";
        toastDescription = `Perdiste ${Math.abs(skillXpChange)} XP, ganaste ${rewards.COINS} monedas.`;
      
      } else { 
        newStreak++;
        rewards = habit.difficulty === 'Easy' ? HABIT_REWARDS.GOOD.EASY : HABIT_REWARDS.GOOD.HARD;
        skillXpChange = rewards.XP;

        await addPlayerXPAndCoins(skillXpChange, rewards.COINS, habit.targetStat, skillXpChange);
        toastTitle = "¡Disciplina Cumplida!";
        toastDescription = `Ganaste ${skillXpChange} XP y ${rewards.COINS} monedas. Racha: ${newStreak}.`;
      }

      const newLongestStreak = Math.max(habit.longestStreak || 0, newStreak);

      await updateDoc(habitDocRef, {
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        lastCompletedDate: newLastCompletedDate,
      });

      toast({ title: toastTitle, description: toastDescription });

    } catch (error) {
      console.error("Error completando/desmarcando disciplina:", error);
      toast({ title: "Error", description: "No se pudo actualizar la disciplina.", variant: "destructive" });
    }
  };

  const deleteHabit = async (habitId: string) => {
    if (!userId) return;
    const habitDocRef = doc(db, 'players', userId, 'habits', habitId);
    try {
      await deleteDoc(habitDocRef);
      toast({ title: "Disciplina Eliminada.", variant: 'destructive' });
    } catch (error) {
      console.error("Error eliminando disciplina:", error);
      toast({ title: "Error", description: "No se pudo eliminar.", variant: "destructive" });
    }
  };

  const addReward = async (rewardData: Omit<RewardItem, 'id' | 'createdAt'>) => {
    if (!userId) {
      toast({ title: "No Autenticado", description: "Debes iniciar sesión.", variant: "destructive" });
      return;
    }
    const rewardColRef = collection(db, 'players', userId, 'rewards');
    try {
      await addDoc(rewardColRef, {
        ...rewardData,
        createdAt: Timestamp.now(),
      });
      toast({ title: "¡Recompensa Añadida!", description: `"${rewardData.title}" disponible en la tienda.` });
    } catch (error) {
      console.error("Error añadiendo recompensa:", error);
      toast({ title: "Error", description: "No se pudo añadir la recompensa.", variant: "destructive" });
    }
  };

  const updateReward = async (rewardId: string, rewardData: Partial<Omit<RewardItem, 'id' | 'createdAt'>>) => {
    if (!userId) return;
    const rewardDocRef = doc(db, 'players', userId, 'rewards', rewardId);
    try {
      await updateDoc(rewardDocRef, rewardData as any);
      toast({ title: "¡Recompensa Actualizada!", variant: 'default' });
    } catch (error) {
      console.error("Error actualizando recompensa:", error);
      toast({ title: "Error", description: "No se pudo actualizar la recompensa.", variant: "destructive" });
    }
  };

  const deleteReward = async (rewardId: string) => {
    if (!userId) return;
    const rewardDocRef = doc(db, 'players', userId, 'rewards', rewardId);
    try {
      await deleteDoc(rewardDocRef);
      toast({ title: "Recompensa Eliminada.", variant: 'destructive' });
    } catch (error) {
      console.error("Error eliminando recompensa:", error);
      toast({ title: "Error", description: "No se pudo eliminar la recompensa.", variant: "destructive" });
    }
  };

  const purchaseReward = async (rewardId: string) => {
    if (!userId || !player) {
      toast({ title: "Error", description: "Jugador no encontrado.", variant: "destructive" });
      return;
    }
    const reward = rewards.find(r => r.id === rewardId);
    if (!reward) {
      toast({ title: "Error", description: "Recompensa no encontrada.", variant: "destructive" });
      return;
    }

    if (player.coins < reward.cost) {
      toast({ title: "Fondos Insuficientes", description: `No tienes suficientes monedas para "${reward.title}".`, variant: "destructive" });
      return;
    }

    const playerDocRef = doc(db, 'players', userId);
    try {
      await updateDoc(playerDocRef, {
        coins: player.coins - reward.cost,
      });
      toast({ title: "¡Recompensa Canjeada!", description: `Disfruta de "${reward.title}".`, variant: "default" });
    } catch (error) {
      console.error("Error canjeando recompensa:", error);
      toast({ title: "Error", description: "No se pudo canjear la recompensa.", variant: "destructive" });
    }
  };


  return (
    <LifeQuestContext.Provider value={{
      player, tasks, habits, rewards, isLoading,
      addTask, updateTask, updateTaskStatus, deleteTask,
      addHabit, updateHabit, completeHabit, deleteHabit,
      updatePlayerProfileAfterQuiz,
      addReward, updateReward, deleteReward, purchaseReward
    }}>
      {children}
    </LifeQuestContext.Provider>
  );
};

export const useLifeQuest = () => {
  const context = useContext(LifeQuestContext);
  if (context === undefined) {
    throw new Error('useLifeQuest debe ser usado dentro de un LifeQuestProvider');
  }
  return context;
};


    