
// Configuración del Nivel del Jugador General
export const XP_PER_LEVEL_MILESTONES = [0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 4000, 5000, 6500, 8000, 10000];
export const MAX_LEVEL = XP_PER_LEVEL_MILESTONES.length - 1;

export const getXPForLevel = (level: number): number => {
  if (level <= 0) return 0;
  if (level > MAX_LEVEL) return XP_PER_LEVEL_MILESTONES[MAX_LEVEL];
  return XP_PER_LEVEL_MILESTONES[level];
};

export const getXPForNextLevel = (currentLevel: number): number | null => {
  if (currentLevel >= MAX_LEVEL) return null;
  return XP_PER_LEVEL_MILESTONES[currentLevel + 1];
};

export const getXPToNextLevelUp = (currentLevel: number, currentXP: number): number | null => {
  if (currentLevel >= MAX_LEVEL) return null;
  const xpNeededForNextLevelMilestone = XP_PER_LEVEL_MILESTONES[currentLevel + 1];
  return Math.max(0, xpNeededForNextLevelMilestone - currentXP);
}

export const getLevelFromXP = (xp: number): number => {
  for (let i = MAX_LEVEL; i >= 0; i--) {
    if (xp >= XP_PER_LEVEL_MILESTONES[i]) {
      return i;
    }
  }
  return 0;
};

// Configuración de Nivel de Skills
export const XP_PER_SKILL_LEVEL = 100;
export const MAX_SKILL_LEVEL = 99; // O el máximo que desees

export const getSkillLevelFromXP = (xp: number): number => {
  return Math.min(MAX_SKILL_LEVEL, Math.floor(xp / XP_PER_SKILL_LEVEL) + 1); // Asumiendo que nivel 1 es con 0-99 XP
};

// Recompensas y Penalizaciones
export const DIFFICULTY_OPTIONS: Readonly<string[]> = ['Fácil', 'Difícil'];

export const HABIT_REWARDS = {
  GOOD: {
    EASY: { XP: 5, COINS: 5 },
    HARD: { XP: 10, COINS: 5 },
  },
  BAD: { // Penalizaciones al "completar" el mal hábito
    EASY: { XP: -25, COINS: 5 }, // Nota: Fácil penaliza más que Difícil según solicitud
    HARD: { XP: -15, COINS: 5 },
  },
};

export const TASK_REWARDS = {
  EASY: { XP: 5, COINS: 5 },
  HARD: { XP: 10, COINS: 10 },
};


// STAT_NAMES ya no se usa como fuente principal, los stats son dinámicos
export const STAT_NAMES: { [key: string]: string } = {
  capacidad: "Capacidad",
  determinacion: "Determinación",
  enfoque: "Enfoque",
  comunicacion: "Comunicación",
  atencion: "Atención",
};

export const TASK_STATUS_OPTIONS: Readonly<string[]> = ['Pendiente', 'En Progreso', 'Completado'];
export const TASK_PRIORITY_OPTIONS: Readonly<string[]> = ['Baja', 'Media', 'Alta', 'Urgente'];
export const HABIT_TYPE_OPTIONS: Readonly<string[]> = ['Bueno', 'A Mejorar'];
export const HABIT_FREQUENCY_OPTIONS: Readonly<string[]> = ['Diario', 'Semanal'];
