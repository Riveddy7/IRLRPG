"use client";

import type { Player, PlayerStats, Task, Habit, TaskStatus } from '@/types';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { MAX_LEVEL, getLevelFromXP, getXPForNextLevel, XP_PER_LEVEL_MILESTONES } from '@/config/game-config';
import { useToast } from './use-toast';

const LOCAL_STORAGE_KEY = 'lifeQuestRPGState';

interface LifeQuestContextType {
  player: Player | null;
  tasks: Task[];
  habits: Habit[];
  isLoading: boolean;
  addTask: (taskData: Omit<Task, 'id' | 'createdAt' | 'status'>) => void;
  updateTask: (taskId: string, taskData: Partial<Task>) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  deleteTask: (taskId: string) => void;
  addHabit: (habitData: Omit<Habit, 'id' | 'createdAt' | 'currentStreak' | 'longestStreak'>) => void;
  updateHabit: (habitId: string, habitData: Partial<Habit>) => void;
  completeHabit: (habitId: string) => void;
  deleteHabit: (habitId: string) => void;
}

const LifeQuestContext = createContext<LifeQuestContextType | undefined>(undefined);

const initialPlayer: Player = {
  id: 'player1',
  name: 'Phantom User',
  avatarUrl: 'https://placehold.co/128x128.png',
  dataAiHint: 'gamer avatar',
  level: 1,
  xp: 0,
  stats: { power: 5, guts: 5, intel: 5, charm: 5, focus: 5 },
};

export const LifeQuestProvider = ({ children }: { children: ReactNode }) => {
  const [player, setPlayer] = useState<Player | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const storedState = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedState) {
      const { player: storedPlayer, tasks: storedTasks, habits: storedHabits } = JSON.parse(storedState);
      setPlayer(storedPlayer);
      setTasks(storedTasks || []);
      setHabits(storedHabits || []);
    } else {
      setPlayer(initialPlayer);
      // Add some default tasks and habits for demo
      setTasks([
        { id: 'task-1', title: 'Conquer The Mementos', description: 'Reach the depths of Mementos', status: 'To Do', priority: 'Critical', xpReward: 100, createdAt: new Date().toISOString() },
        { id: 'task-2', title: 'Ace Midterms', description: 'Study hard and get top scores', status: 'In Progress', priority: 'High', xpReward: 50, createdAt: new Date().toISOString(), dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() },
      ]);
      setHabits([
        { id: 'habit-1', title: 'Daily Training', type: 'Good', frequency: 'Daily', targetStat: 'power', statImprovementValue: 1, currentStreak: 0, longestStreak: 0, createdAt: new Date().toISOString() },
      ]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ player, tasks, habits }));
    }
  }, [player, tasks, habits, isLoading]);

  const addXP = useCallback((amount: number) => {
    if (!player) return;
    setPlayer(prevPlayer => {
      if (!prevPlayer) return null;
      const newXP = prevPlayer.xp + amount;
      const newLevel = getLevelFromXP(newXP);
      let levelUpOccurred = false;
      if (newLevel > prevPlayer.level) {
        levelUpOccurred = true;
        toast({
          title: "LEVEL UP!",
          description: `You've reached Level ${newLevel}!`,
          variant: 'default',
        });
        // Potentially add stat points or other rewards here
      }
      return { ...prevPlayer, xp: newXP, level: newLevel };
    });
  }, [player, toast]);

  const updatePlayerStats = useCallback((stat: keyof PlayerStats, valueChange: number) => {
    setPlayer(prevPlayer => {
      if (!prevPlayer) return null;
      return {
        ...prevPlayer,
        stats: {
          ...prevPlayer.stats,
          [stat]: Math.max(0, prevPlayer.stats[stat] + valueChange), // Ensure stats don't go below 0
        },
      };
    });
  }, []);


  const addTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'status'>) => {
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'To Do',
    };
    setTasks(prev => [newTask, ...prev]);
    toast({ title: "Mission Added!", description: `"${taskData.title}" is now on your list.`, variant: 'default' });
  };

  const updateTask = (taskId: string, taskData: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...taskData } : t));
  };

  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        if (status === 'Done' && t.status !== 'Done') {
          addXP(t.xpReward);
          toast({ title: "Mission Complete!", description: `You earned ${t.xpReward} XP for "${t.title}".`, variant: 'default' });
        }
        return { ...t, status };
      }
      return t;
    }));
  };
  
  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    toast({ title: "Mission Abandoned.", variant: 'destructive' });
  };

  const addHabit = (habitData: Omit<Habit, 'id' | 'createdAt' | 'currentStreak' | 'longestStreak'>) => {
    const newHabit: Habit = {
      ...habitData,
      id: `habit-${Date.now()}`,
      createdAt: new Date().toISOString(),
      currentStreak: 0,
      longestStreak: 0,
    };
    setHabits(prev => [newHabit, ...prev]);
     toast({ title: "Discipline Established!", description: `New habit "${habitData.title}" formed.` });
  };

  const updateHabit = (habitId: string, habitData: Partial<Habit>) => {
    setHabits(prev => prev.map(h => h.id === habitId ? { ...h, ...habitData } : h));
  };

  const completeHabit = (habitId: string) => {
    setHabits(prev => prev.map(h => {
      if (h.id === habitId) {
        const today = new Date().toISOString().split('T')[0];
        // Basic check: only allow one completion per day. More robust logic needed for other frequencies.
        if (h.lastCompletedDate === today && h.frequency === 'Daily') {
          toast({ title: "Already Done!", description: "You've already completed this daily habit today.", variant: "default"});
          return h;
        }

        let newStreak = h.currentStreak + 1;
        let newLongestStreak = Math.max(h.longestStreak, newStreak);
        
        if (h.targetStat) {
          updatePlayerStats(h.targetStat, h.statImprovementValue);
          toast({ title: "Discipline Honed!", description: `Your ${h.targetStat} increased! Streak: ${newStreak}.`, variant: "default" });
        } else {
           toast({ title: "Discipline Honed!", description: `Habit completed! Streak: ${newStreak}.`, variant: "default" });
        }

        return { ...h, currentStreak: newStreak, longestStreak: newLongestStreak, lastCompletedDate: today };
      }
      return h;
    }));
  };

  const deleteHabit = (habitId: string) => {
    setHabits(prev => prev.filter(h => h.id !== habitId));
    toast({ title: "Discipline Abandoned.", variant: 'destructive' });
  };


  return (
    <LifeQuestContext.Provider value={{ player, tasks, habits, isLoading, addTask, updateTask, updateTaskStatus, deleteTask, addHabit, updateHabit, completeHabit, deleteHabit }}>
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
