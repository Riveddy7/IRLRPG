
export interface PlayerSkill {
  xp: number;
  level: number;
}

export interface PlayerStats {
  [key: string]: PlayerSkill; // Stats ahora tienen xp y level
}

export interface Player {
  id: string;
  name: string;
  avatarUrl: string;
  dataAiHint?: string;
  level: number; // Nivel general del jugador
  xp: number;    // XP general del jugador
  coins: number; // Nueva moneda del juego
  stats: PlayerStats; // Skills/atributos dinámicos del jugador
  age?: number;
  genderAvatarKey?: string;
  improvementAreas?: string;
  statDescriptions?: { [key: string]: string };
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
  difficulty: Difficulty; // Nueva propiedad
  targetStat?: string; // Skill vinculada (opcional para tareas)
  // xpReward ya no se define aquí, se deriva de la dificultad
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
  targetStat?: string; // Skill vinculada (opcional, pero recomendado)
  difficulty: Difficulty; // Nueva propiedad
  // statImprovementValue se elimina
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate?: string; // ISO date string (YYYY-MM-DD)
  createdAt: string; // ISO string
}
