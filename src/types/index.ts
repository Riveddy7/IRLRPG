
export interface PlayerSkill {
  xp: number;
  level: number;
}

export interface PlayerStats {
  [key: string]: PlayerSkill;
}

export interface Player {
  id: string;
  name: string;
  genderAvatarKey?: string;
  level: number;
  xp: number;
  coins: number;
  stats: PlayerStats;
  age?: number;
  improvementAreas?: string; // Aspiraciones del usuario
  statDescriptions?: { [key: string]: string }; // Descripciones de los atributos generados por IA
  characterPreamble?: string; // Introducción generada por IA en el quiz
  hasCompletedQuiz: boolean;
}

export type TaskStatus = 'To Do' | 'In Progress' | 'Done';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type Difficulty = 'Easy' | 'Hard';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  dueDate?: string; // ISO string
  priority: TaskPriority;
  difficulty: Difficulty;
  targetStat?: string; // Atributo que mejora
  createdAt: string; // ISO string
}

export type HabitType = 'Good' | 'Bad';
export type HabitFrequency = 'Daily' | 'Weekly' | string[];

export interface Habit {
  id: string;
  title: string;
  description?: string;
  type: HabitType;
  frequency: HabitFrequency;
  targetStat?: string; // Atributo que mejora
  difficulty: Difficulty;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate?: string; // ISO date string (YYYY-MM-DD)
  createdAt: string; // ISO string
}

export interface RewardItem {
  id: string;
  title: string;
  description?: string;
  cost: number;
  icon?: string; 
  createdAt: string; // ISO string
}
