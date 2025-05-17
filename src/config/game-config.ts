
export const XP_PER_LEVEL_MILESTONES = [0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 4000, 5000, 6500, 8000, 10000]; // XP needed to *reach* this level
export const MAX_LEVEL = XP_PER_LEVEL_MILESTONES.length -1;

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

// STAT_NAMES y HABIT_TARGET_STAT_OPTIONS ya no son la fuente principal para el perfil del jugador,
// ya que los stats son dinámicos. Se conservan por si alguna lógica futura los necesita
// o para ofrecerlos como sugerencias si no hay stats de jugador aún.
// Sin embargo, PlayerStats.tsx y HabitForm.tsx obtendrán los stats del perfil del jugador.
export const STAT_NAMES: { [key: string]: string } = {
  power: "Poder",
  guts: "Agallas",
  intel: "Intelecto",
  charm: "Carisma",
  focus: "Concentración",
};

export const TASK_STATUS_OPTIONS: Readonly<string[]> = ['To Do', 'In Progress', 'Done'];
export const TASK_PRIORITY_OPTIONS: Readonly<string[]> = ['Low', 'Medium', 'High', 'Critical'];
export const HABIT_TYPE_OPTIONS: Readonly<string[]> = ['Good', 'Bad'];
export const HABIT_FREQUENCY_OPTIONS: Readonly<string[]> = ['Daily', 'Weekly']; 
// HABIT_TARGET_STAT_OPTIONS se llenará dinámicamente en el formulario de hábitos
// a partir de los stats actuales del jugador. Mantenerlo aquí como fallback o referencia es opcional.
// export const HABIT_TARGET_STAT_OPTIONS: Readonly<(keyof import('@/types').PlayerStats)[]> = ['power', 'guts', 'intel', 'charm', 'focus'];
// En su lugar, en HabitForm, se usarán Object.keys(player.stats)
