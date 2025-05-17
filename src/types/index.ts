export interface PlayerStats {
  power: number;
  guts: number;
  intel: number;
  charm: number;
  focus: number;
}

export interface Player {
  id: string;
  name: string;
  avatarUrl: string;
  level: number;
  xp: number;
  stats: PlayerStats;
}

export type TaskStatus = 'To Do' | 'In Progress' | 'Done';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  dueDate?: string; // ISO string
  priority: TaskPriority;
  xpReward: number;
  createdAt: string; // ISO string
}

export type HabitType = 'Good' | 'Bad'; // Good to build, Bad to break
export type HabitFrequency = 'Daily' | 'Weekly' | string[]; // string[] for specific days e.g. ['Mon', 'Wed', 'Fri']

export interface Habit {
  id: string;
  title: string;
  description?: string;
  type: HabitType;
  frequency: HabitFrequency;
  targetStat?: keyof PlayerStats;
  statImprovementValue: number; // Can be positive for Good, negative for Bad (if not completed)
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate?: string; // ISO string
  createdAt: string; // ISO string
}
