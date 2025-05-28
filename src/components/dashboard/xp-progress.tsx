
"use client";
import { Progress } from '@/components/ui/progress';
import { getXPForLevel, getXPForNextLevel, MAX_LEVEL } from '@/config/game-config';
import { Star } from 'lucide-react';

interface XPProgressProps {
  currentXP: number;
  currentLevel: number;
}

export function XPProgress({ currentXP, currentLevel }: XPProgressProps) {
  const xpForCurrentLevel = getXPForLevel(currentLevel);
  const xpForNextLevel = getXPForNextLevel(currentLevel);

  let progressPercentage = 0;
  let xpToNext = null;
  
  // XP earned within the current level's range (from start of current level to current XP)
  let xpEarnedInThisLevelRange = currentXP - xpForCurrentLevel;
  // Total XP required to go from start of current level to start of next level
  let totalXPForThisLevelRange = 0;


  if (currentLevel < MAX_LEVEL && xpForNextLevel !== null) {
    totalXPForThisLevelRange = xpForNextLevel - xpForCurrentLevel;
    progressPercentage = totalXPForThisLevelRange > 0 ? (xpEarnedInThisLevelRange / totalXPForThisLevelRange) * 100 : 100;
    xpToNext = totalXPForThisLevelRange - xpEarnedInThisLevelRange;
  } else {
    // Max level reached or xpForNextLevel is null
    progressPercentage = 100; // Show as full if max level
    // For display purposes, show XP accumulated since reaching max level, or simply current total XP if preferred
    // Let's assume totalXPForThisLevelRange represents the XP needed for the "last" level up to MAX_LEVEL
    const xpForMaxLevelMinusOne = getXPForLevel(MAX_LEVEL -1);
    totalXPForThisLevelRange = xpForCurrentLevel - xpForMaxLevelMinusOne; // Approx XP for the max level bar
    xpEarnedInThisLevelRange = currentXP - xpForCurrentLevel; // XP into the max level
  }

  return (
    <div className="space-y-1">
      <Progress value={progressPercentage} className="w-full h-2 sm:h-2.5 bg-primary/30 [&>div]:bg-primary" />
      <div className="flex justify-between text-xs sm:text-sm text-muted-foreground">
        <span>XP: <span className="font-bold text-foreground">{currentXP}</span></span>
        {xpForNextLevel !== null && currentLevel < MAX_LEVEL ? (
          <span>Sgte. Nivel: <span className="font-bold text-foreground">{xpForNextLevel}</span> ({xpToNext} XP)</span>
        ) : (
          <span className="font-bold text-accent">NIVEL MÁXIMO</span>
        )}
      </div>
    </div>
  );
}

// Re-add XP_PER_LEVEL_MILESTONES if not exported from game-config, or import it.
// For simplicity, let's assume it's available or correctly imported.
// If getXPForLevel etc. are in game-config, they use XP_PER_LEVEL_MILESTONES from there.

const XP_PER_LEVEL_MILESTONES = [0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 4000, 5000, 6500, 8000, 10000];
