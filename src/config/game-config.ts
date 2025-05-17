export const XP_PER_LEVEL_MILESTONES = [0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 4000, 5000, 6500, 8000, 10000]; // XP needed to *reach* this level
export const MAX_LEVEL = XP_PER_LEVEL_MILESTONES.length -1;

export const getXPForLevel = (level: number): number => {
  if (level <= 0) return 0;
  if (level > MAX_LEVEL) return XP_PER_LEVEL_MILESTONES[MAX_LEVEL];
  return XP_PER_LEVEL_MILESTONES[level];
};

export const getXPForNextLevel = (currentLevel: number): number | null => {
  if (currentLevel >= MAX_LEVEL) return null;
  // XP needed for the *next* level milestone
  return XP_PER_LEVEL_MILESTONES[currentLevel + 1];
};

// Calculates total XP needed to progress from currentLevel's start to nextLevel's start
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
  return 0; // Default to level 0 if XP is somehow negative or less than first milestone
};

export const STAT_NAMES: { [key: string]: string } = {
  power: "Power",
  guts: "Guts",
  intel: "Intellect",
  charm: "Charm",
  focus: "Focus",
};

export const TASK_STATUS_OPTIONS: Readonly<string[]> = ['To Do', 'In Progress', 'Done'];
export const TASK_PRIORITY_OPTIONS: Readonly<string[]> = ['Low', 'Medium', 'High', 'Critical'];
export const HABIT_TYPE_OPTIONS: Readonly<string[]> = ['Good', 'Bad'];
export const HABIT_FREQUENCY_OPTIONS: Readonly<string[]> = ['Daily', 'Weekly']; // Simplified for now
export const HABIT_TARGET_STAT_OPTIONS: Readonly<(keyof import('@/types').PlayerStats)[]> = ['power', 'guts', 'intel', 'charm', 'focus'];
