
"use client";

import type { Player, PlayerStats, Task, Habit, TaskStatus } from '@/types';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { MAX_LEVEL, getLevelFromXP, STAT_NAMES } from '@/config/game-config';
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
  serverTimestamp // Placeholder, will use Timestamp.now() for client
} from 'firebase/firestore';

// const LOCAL_STORAGE_KEY = 'lifeQuestRPGState'; // No longer used

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
}

const LifeQuestContext = createContext<LifeQuestContextType | undefined>(undefined);

const initialPlayer: Player = {
  id: 'player1', // This ID will be used as the document ID in Firestore
  name: 'Phantom User',
  avatarUrl: 'https://placehold.co/128x128.png',
  dataAiHint: 'gamer avatar',
  level: 1,
  xp: 0,
  stats: { power: 5, guts: 5, intel: 5, charm: 5, focus: 5 },
};

const defaultTasksData: Omit<Task, 'id' | 'createdAt' | 'status'>[] = [
  { title: 'Conquer The Mementos', description: 'Reach the depths of Mementos', priority: 'Critical', xpReward: 100 },
  { title: 'Ace Midterms', description: 'Study hard and get top scores', priority: 'High', xpReward: 50, dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() },
];

const defaultHabitsData: Omit<Habit, 'id' | 'createdAt' | 'currentStreak' | 'longestStreak' | 'lastCompletedDate'>[] = [
  { title: 'Daily Training', type: 'Good', frequency: 'Daily', targetStat: 'power', statImprovementValue: 1 },
];


export const LifeQuestProvider = ({ children }: { children: ReactNode }) => {
  const [player, setPlayer] = useState<Player | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  const playerId = initialPlayer.id; // For now, we'll use a fixed player ID

  // Fetch initial data and set up listeners
  useEffect(() => {
    if (!playerId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);

    const playerDocRef = doc(db, 'players', playerId);

    const unsubscribePlayer = onSnapshot(playerDocRef, async (docSnap) => {
      if (docSnap.exists()) {
        setPlayer(docSnap.data() as Player);
      } else {
        // Player doesn't exist, create them with initial data
        try {
          await setDoc(playerDocRef, initialPlayer);
          setPlayer(initialPlayer);
          toast({ title: "Welcome, Phantom User!", description: "Your LifeQuest journey begins!"});

          // Add default tasks and habits
          const batch = writeBatch(db);
          defaultTasksData.forEach(taskData => {
            const taskColRef = collection(db, 'players', playerId, 'tasks');
            const newTaskRef = doc(taskColRef); // Auto-generate ID
            batch.set(newTaskRef, {
              ...taskData,
              status: 'To Do',
              createdAt: Timestamp.now(),
              dueDate: taskData.dueDate ? Timestamp.fromDate(new Date(taskData.dueDate)) : undefined,
            });
          });
          defaultHabitsData.forEach(habitData => {
            const habitColRef = collection(db, 'players', playerId, 'habits');
            const newHabitRef = doc(habitColRef); // Auto-generate ID
            batch.set(newHabitRef, {
              ...habitData,
              currentStreak: 0,
              longestStreak: 0,
              createdAt: Timestamp.now(),
            });
          });
          await batch.commit();

        } catch (error) {
          console.error("Error creating player or initial data:", error);
          toast({ title: "Error", description: "Could not initialize player data.", variant: "destructive" });
        }
      }
    }, (error) => {
      console.error("Error fetching player data:", error);
      toast({ title: "Error", description: "Could not fetch player data.", variant: "destructive" });
      // setIsLoading(false); // Keep true if player is essential
    });

    const tasksQuery = query(collection(db, 'players', playerId, 'tasks'));
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
      console.error("Error fetching tasks:", error);
      toast({ title: "Error", description: "Could not fetch tasks.", variant: "destructive" });
    });

    const habitsQuery = query(collection(db, 'players', playerId, 'habits'));
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
      console.error("Error fetching habits:", error);
      toast({ title: "Error", description: "Could not fetch habits.", variant: "destructive" });
    });
    
    // Determine loading state after all initial fetches/setups might be attempted.
    // A more robust solution might involve Promise.all or tracking individual loading states.
    Promise.all([getDoc(playerDocRef)]).finally(() => setIsLoading(false));


    return () => {
      unsubscribePlayer();
      unsubscribeTasks();
      unsubscribeHabits();
    };
  }, [playerId, toast]);


  const addXP = useCallback(async (amount: number) => {
    if (!player) return;
    const playerDocRef = doc(db, 'players', playerId);
    const newXP = player.xp + amount;
    const newLevel = getLevelFromXP(newXP);
    
    const updates: Partial<Player> = { xp: newXP };
    if (newLevel > player.level) {
      updates.level = newLevel;
      toast({
        title: "LEVEL UP!",
        description: `You've reached Level ${newLevel}!`,
        variant: 'default',
      });
    }
    try {
      await updateDoc(playerDocRef, updates);
    } catch (error) {
      console.error("Error updating XP:", error);
      toast({ title: "Error", description: "Could not update XP.", variant: "destructive" });
    }
  }, [player, playerId, toast]);

  const updatePlayerStats = useCallback(async (stat: keyof PlayerStats, valueChange: number) => {
    if (!player) return;
    const playerDocRef = doc(db, 'players', playerId);
    const newStatValue = Math.max(0, player.stats[stat] + valueChange);
    try {
      await updateDoc(playerDocRef, {
        [`stats.${stat}`]: newStatValue,
      });
       toast({ title: "Attribute Updated!", description: `${STAT_NAMES[stat]} changed by ${valueChange}. New value: ${newStatValue}`});
    } catch (error) {
      console.error("Error updating player stats:", error);
      toast({ title: "Error", description: "Could not update player stats.", variant: "destructive" });
    }
  }, [player, playerId, toast]);


  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'status'>) => {
    if (!playerId) return;
    const taskColRef = collection(db, 'players', playerId, 'tasks');
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
      toast({ title: "Mission Added!", description: `"${taskData.title}" is now on your list.`, variant: 'default' });
    } catch (error) {
      console.error("Error adding task:", error);
      toast({ title: "Error", description: "Could not add mission.", variant: "destructive" });
    }
  };

  const updateTask = async (taskId: string, taskData: Partial<Omit<Task, 'id' | 'createdAt'>>) => {
    if (!playerId) return;
    const taskDocRef = doc(db, 'players', playerId, 'tasks', taskId);
    try {
      const updatePayload: any = { ...taskData };
      if (taskData.dueDate) {
        updatePayload.dueDate = Timestamp.fromDate(new Date(taskData.dueDate));
      } else if (taskData.hasOwnProperty('dueDate') && taskData.dueDate === undefined) {
         // Explicitly remove dueDate if set to undefined. Firestore needs deleteField for this,
         // or ensure the form passes null if it means to clear it and handle nulls.
         // For simplicity, we'll let it set to null if passed as undefined.
         updatePayload.dueDate = null; 
      }

      await updateDoc(taskDocRef, updatePayload);
      toast({ title: "Mission Updated!", variant: 'default' });
    } catch (error) {
      console.error("Error updating task:", error);
      toast({ title: "Error", description: "Could not update mission.", variant: "destructive" });
    }
  };

  const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
    if (!playerId) return;
    const taskDocRef = doc(db, 'players', playerId, 'tasks', taskId);
    try {
      const taskSnap = await getDoc(taskDocRef);
      if (taskSnap.exists()) {
        const task = taskSnap.data() as Task;
        if (status === 'Done' && task.status !== 'Done') {
          addXP(task.xpReward); // addXP will show its own toast
        } else {
           toast({ title: "Mission Status Updated!", description: `Mission set to ${status}.` });
        }
        await updateDoc(taskDocRef, { status });
      }
    } catch (error) {
      console.error("Error updating task status:", error);
      toast({ title: "Error", description: "Could not update mission status.", variant: "destructive" });
    }
  };
  
  const deleteTask = async (taskId: string) => {
    if (!playerId) return;
    const taskDocRef = doc(db, 'players', playerId, 'tasks', taskId);
    try {
      await deleteDoc(taskDocRef);
      toast({ title: "Mission Abandoned.", variant: 'destructive' });
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({ title: "Error", description: "Could not abandon mission.", variant: "destructive" });
    }
  };

  const addHabit = async (habitData: Omit<Habit, 'id' | 'createdAt' | 'currentStreak' | 'longestStreak' | 'lastCompletedDate'>) => {
    if (!playerId) return;
    const habitColRef = collection(db, 'players', playerId, 'habits');
    try {
      await addDoc(habitColRef, {
        ...habitData,
        currentStreak: 0,
        longestStreak: 0,
        createdAt: Timestamp.now(),
        // lastCompletedDate is not set on creation
      });
      toast({ title: "Discipline Established!", description: `New habit "${habitData.title}" formed.` });
    } catch (error) {
      console.error("Error adding habit:", error);
      toast({ title: "Error", description: "Could not establish discipline.", variant: "destructive" });
    }
  };

  const updateHabit = async (habitId: string, habitData: Partial<Omit<Habit, 'id' | 'createdAt'>>) => {
     if (!playerId) return;
    const habitDocRef = doc(db, 'players', playerId, 'habits', habitId);
    try {
      await updateDoc(habitDocRef, habitData);
      toast({ title: "Discipline Updated!", variant: 'default' });
    } catch (error) {
      console.error("Error updating habit:", error);
      toast({ title: "Error", description: "Could not update discipline.", variant: "destructive" });
    }
  };

  const completeHabit = async (habitId: string) => {
    if (!playerId || !player) return;
    const habitDocRef = doc(db, 'players', playerId, 'habits', habitId);
    
    try {
      const habitSnap = await getDoc(habitDocRef);
      if (!habitSnap.exists()) {
        toast({ title: "Error", description: "Habit not found.", variant: "destructive" });
        return;
      }

      const habit = { id: habitSnap.id, ...habitSnap.data() } as Habit;
      const today = new Date().toISOString().split('T')[0];
      
      // Firestore Timestamps are converted to ISO strings when mapping data for `habits` state
      // So `habit.lastCompletedDate` here would be an ISO date string part, or undefined.
      if (habit.frequency === 'Daily' && habit.lastCompletedDate === today) {
        toast({ title: "Already Done!", description: "You've already completed this daily habit today.", variant: "default"});
        return;
      }

      const newStreak = (habit.type === 'Good' ? (habit.currentStreak || 0) + 1 : 0); // Reset streak for 'Bad' habits if completed (means avoided)
      const newLongestStreak = Math.max(habit.longestStreak || 0, newStreak);
      
      const updates: Partial<Habit> = {
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        lastCompletedDate: Timestamp.fromDate(new Date()).toDate().toISOString().split('T')[0], // Store as date string part
      };

      await updateDoc(habitDocRef, {
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        lastCompletedDate: Timestamp.fromDate(new Date()), // Store as Timestamp
      });

      if (habit.type === 'Good' && habit.targetStat) {
        await updatePlayerStats(habit.targetStat, habit.statImprovementValue); // updatePlayerStats shows its own toast
        // Toast for streak will be handled by updatePlayerStats or a separate one if no stat change
      } else {
         toast({ title: "Discipline Honed!", description: `Habit completed! Streak: ${newStreak}.`, variant: "default" });
      }

    } catch (error) {
      console.error("Error completing habit:", error);
      toast({ title: "Error", description: "Could not complete habit.", variant: "destructive" });
    }
  };

  const deleteHabit = async (habitId: string) => {
    if (!playerId) return;
    const habitDocRef = doc(db, 'players', playerId, 'habits', habitId);
    try {
      await deleteDoc(habitDocRef);
      toast({ title: "Discipline Abandoned.", variant: 'destructive' });
    } catch (error) {
      console.error("Error deleting habit:", error);
      toast({ title: "Error", description: "Could not abandon discipline.", variant: "destructive" });
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
      deleteHabit 
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
