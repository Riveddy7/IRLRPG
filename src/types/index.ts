
export interface PlayerStats {
  [key: string]: number; // Stats ahora son dinámicos
}

export interface Player {
  id: string;
  name: string; // Se establecerá en el quiz
  avatarUrl: string; // Se establecerá en el quiz
  dataAiHint?: string;
  level: number;
  xp: number;
  stats: PlayerStats; // Stats dinámicos
  age?: number;
  genderAvatarKey?: string; // e.g., 'avatar1', 'avatar2'
  improvementAreas?: string; // Texto del usuario
  statDescriptions?: { [key: string]: string }; // Descripciones para los stats dinámicos
  hasCompletedQuiz: boolean;
}

export type TaskStatus = 'To Do' | 'In Progress' | 'Done';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  dueDate?: string; // ISO string (from Firestore Timestamp)
  priority: TaskPriority;
  xpReward: number;
  createdAt: string; // ISO string (from Firestore Timestamp)
}

export type HabitType = 'Good' | 'Bad'; // Good to build, Bad to break
export type HabitFrequency = 'Daily' | 'Weekly' | string[]; // string[] for specific days e.g. ['Mon', 'Wed', 'Fri']

export interface Habit {
  id: string;
  title: string;
  description?: string;
  type: HabitType;
  frequency: HabitFrequency;
  targetStat?: string; // Ahora será el nombre del stat dinámico
  statImprovementValue: number;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate?: string; // ISO date string (YYYY-MM-DD) (from Firestore Timestamp)
  createdAt: string; // ISO string (from Firestore Timestamp)
}
