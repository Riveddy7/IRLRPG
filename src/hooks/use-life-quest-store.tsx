
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
  // serverTimestamp, // Not used directly, Timestamp.now() on client for creation
} from 'firebase/firestore';
import { useAuth } from './use-auth'; // Import useAuth

interface LifeQuestContextType {
  player: Player | null;
  tasks: Task[];
  habits: Habit[];
  isLoading: boolean; // This will reflect loading of LifeQuest data, not auth state
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

export const LifeQuestProvider = ({ children }: { children: ReactNode }) => {
  const { user, isLoading: authIsLoading, createNewPlayerDocument } = useAuth(); // Get user and auth loading state
  const [player, setPlayer] = useState<Player | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true); // For LifeQuest data loading
  const { toast } = useToast();
  
  const userId = user?.uid; // Use the authenticated user's ID

  useEffect(() => {
    if (authIsLoading) {
      setIsLoading(true); // If auth is loading, LifeQuest data is also effectively loading
      return;
    }

    if (!userId) {
      // No user logged in, reset state and stop loading
      setPlayer(null);
      setTasks([]);
      setHabits([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true); // Start loading LifeQuest data for the logged-in user
    const playerDocRef = doc(db, 'players', userId);

    const unsubscribePlayer = onSnapshot(playerDocRef, async (docSnap) => {
      if (docSnap.exists()) {
        setPlayer(docSnap.data() as Player);
      } else {
        // Player document doesn't exist for this UID.
        // This should ideally be handled at registration by createNewPlayerDocument in useAuth.
        // If we reach here, it might mean an issue or a user exists in Auth but not Firestore.
        // For robustness, we could attempt to create it, or log an error.
        // For now, we assume createNewPlayerDocument handles it.
        // If it was just created, this listener will pick it up.
        // If not, it might be an orphaned auth user.
        console.warn(`Player document for UID ${userId} not found. It should have been created on registration.`);
        // To prevent errors, set player to null or a default state if desired
        setPlayer(null); 
        // Optionally, try to create it now if it's missing
        // if(user?.email) await createNewPlayerDocument(userId, user.email);
      }
    }, (error) => {
      console.error(`Error fetching player data for UID ${userId}:`, error);
      toast({ title: "Error", description: "Could not fetch player data.", variant: "destructive" });
      setPlayer(null); // Reset on error
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
      toast({ title: "Error", description: "Could not fetch tasks.", variant: "destructive" });
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
      toast({ title: "Error", description: "Could not fetch habits.", variant: "destructive" });
    });
    
    // Combined loading state, set to false once all initial listeners are established
    // For a more accurate loading state, you might track individual loads.
    // This simplified approach assumes listeners are set up quickly.
    // Ensure this is after all snapshot listeners are attached
    const checkInitialLoad = async () => {
        try {
            await getDoc(playerDocRef); // Check if player doc exists or attempt to load it.
        } catch(e) {
            // Error already handled by onSnapshot error callback
        } finally {
            setIsLoading(false); // Stop loading once the attempt is made
        }
    };
    checkInitialLoad();

    return () => {
      unsubscribePlayer();
      unsubscribeTasks();
      unsubscribeHabits();
    };
  }, [userId, authIsLoading, toast, createNewPlayerDocument, user?.email]);


  const addXP = useCallback(async (amount: number) => {
    if (!userId || !player) return; // Ensure userId and player are available
    const playerDocRef = doc(db, 'players', userId);
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
      await updateDoc(playerDocRef, updates as any); // Using 'as any' to bypass strict Partial<Player> type if needed
    } catch (error) {
      console.error("Error updating XP:", error);
      toast({ title: "Error", description: "Could not update XP.", variant: "destructive" });
    }
  }, [player, userId, toast]);

  const updatePlayerStats = useCallback(async (stat: keyof PlayerStats, valueChange: number) => {
    if (!userId || !player) return;
    const playerDocRef = doc(db, 'players', userId);
    const newStatValue = Math.max(0, (player.stats[stat] || 0) + valueChange);
    try {
      await updateDoc(playerDocRef, {
        [`stats.${stat}`]: newStatValue,
      });
       toast({ title: "Attribute Updated!", description: `${STAT_NAMES[stat]} changed by ${valueChange}. New value: ${newStatValue}`});
    } catch (error) {
      console.error("Error updating player stats:", error);
      toast({ title: "Error", description: "Could not update player stats.", variant: "destructive" });
    }
  }, [player, userId, toast]);


  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'status'>) => {
    if (!userId) {
      toast({ title: "Not Logged In", description: "You must be logged in to add tasks.", variant: "destructive"});
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
      toast({ title: "Mission Added!", description: `"${taskData.title}" is now on your list.`, variant: 'default' });
    } catch (error) {
      console.error("Error adding task:", error);
      toast({ title: "Error", description: "Could not add mission.", variant: "destructive" });
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
      toast({ title: "Mission Updated!", variant: 'default' });
    } catch (error) {
      console.error("Error updating task:", error);
      toast({ title: "Error", description: "Could not update mission.", variant: "destructive" });
    }
  };

  const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
    if (!userId) return;
    const taskDocRef = doc(db, 'players', userId, 'tasks', taskId);
    try {
      const taskSnap = await getDoc(taskDocRef);
      if (taskSnap.exists()) {
        const task = taskSnap.data() as Task; // Make sure Task type includes xpReward
        if (status === 'Done' && task.status !== 'Done') {
          addXP(task.xpReward);
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
    if (!userId) return;
    const taskDocRef = doc(db, 'players', userId, 'tasks', taskId);
    try {
      await deleteDoc(taskDocRef);
      toast({ title: "Mission Abandoned.", variant: 'destructive' });
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({ title: "Error", description: "Could not abandon mission.", variant: "destructive" });
    }
  };

  const addHabit = async (habitData: Omit<Habit, 'id' | 'createdAt' | 'currentStreak' | 'longestStreak' | 'lastCompletedDate'>) => {
    if (!userId) {
      toast({ title: "Not Logged In", description: "You must be logged in to add habits.", variant: "destructive"});
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
      toast({ title: "Discipline Established!", description: `New habit "${habitData.title}" formed.` });
    } catch (error) {
      console.error("Error adding habit:", error);
      toast({ title: "Error", description: "Could not establish discipline.", variant: "destructive" });
    }
  };

  const updateHabit = async (habitId: string, habitData: Partial<Omit<Habit, 'id' | 'createdAt'>>) => {
     if (!userId) return;
    const habitDocRef = doc(db, 'players', userId, 'habits', habitId);
    try {
      await updateDoc(habitDocRef, habitData as any); // Using 'as any' for flexibility with Partial
      toast({ title: "Discipline Updated!", variant: 'default' });
    } catch (error) {
      console.error("Error updating habit:", error);
      toast({ title: "Error", description: "Could not update discipline.", variant: "destructive" });
    }
  };

  const completeHabit = async (habitId: string) => {
    if (!userId || !player) return;
    const habitDocRef = doc(db, 'players', userId, 'habits', habitId);
    
    try {
      const habitSnap = await getDoc(habitDocRef);
      if (!habitSnap.exists()) {
        toast({ title: "Error", description: "Habit not found.", variant: "destructive" });
        return;
      }

      const habitData = habitSnap.data();
      // Reconstruct habit with proper types for dates
      const habit: Habit = {
        id: habitSnap.id,
        ...habitData,
        createdAt: (habitData.createdAt as Timestamp).toDate().toISOString(),
        lastCompletedDate: habitData.lastCompletedDate ? (habitData.lastCompletedDate as Timestamp).toDate().toISOString().split('T')[0] : undefined,
      } as Habit;

      const today = new Date().toISOString().split('T')[0];
      
      if (habit.frequency === 'Daily' && habit.lastCompletedDate === today) {
        toast({ title: "Already Done!", description: "You've already completed this daily habit today.", variant: "default"});
        return;
      }

      const newStreak = (habit.type === 'Good' ? (habit.currentStreak || 0) + 1 : 0);
      const newLongestStreak = Math.max(habit.longestStreak || 0, newStreak);
      
      await updateDoc(habitDocRef, {
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        lastCompletedDate: Timestamp.fromDate(new Date()), 
      });

      if (habit.type === 'Good' && habit.targetStat) {
        await updatePlayerStats(habit.targetStat, habit.statImprovementValue);
      } else {
         toast({ title: "Discipline Honed!", description: `Habit completed! Streak: ${newStreak}.`, variant: "default" });
      }

    } catch (error) {
      console.error("Error completing habit:", error);
      toast({ title: "Error", description: "Could not complete habit.", variant: "destructive" });
    }
  };

  const deleteHabit = async (habitId: string) => {
    if (!userId) return;
    const habitDocRef = doc(db, 'players', userId, 'habits', habitId);
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
      isLoading, // This is the LifeQuest data loading state
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
