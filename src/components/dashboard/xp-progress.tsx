
"use client";
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  let xpEarnedInThisLevelRange = 0;
  let totalXPForThisLevelRange = 0;

  if (currentLevel < MAX_LEVEL && xpForNextLevel !== null) {
    totalXPForThisLevelRange = xpForNextLevel - xpForCurrentLevel;
    xpEarnedInThisLevelRange = currentXP - xpForCurrentLevel;
    progressPercentage = totalXPForThisLevelRange > 0 ? (xpEarnedInThisLevelRange / totalXPForThisLevelRange) * 100 : 100;
    xpToNext = totalXPForThisLevelRange - xpEarnedInThisLevelRange;
  } else {
    // Max level reached or xpForNextLevel is null (should not happen if MAX_LEVEL is set correctly)
    progressPercentage = 100;
    xpEarnedInThisLevelRange = currentXP - xpForCurrentLevel; // XP accumulated in the max level
    totalXPForThisLevelRange = XP_PER_LEVEL_MILESTONES[MAX_LEVEL] - (XP_PER_LEVEL_MILESTONES[MAX_LEVEL-1] || 0) ; // Approx. XP for max level
  }

  return (
    <Card className="shadow-lg rounded-lg bg-card/80 backdrop-blur-sm">
      <CardHeader className="p5-panel-header !py-2 !px-4 !pb-1">
        <CardTitle className="text-base sm:text-lg flex items-center">
          <Star className="mr-2 h-4 w-4 sm:h-5 sm:w-5"/>
          Experience Points
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 space-y-2">
        <Progress value={progressPercentage} className="w-full h-2.5 sm:h-3 bg-primary/30 [&>div]:bg-primary" />
        <div className="flex justify-between text-xs sm:text-sm text-muted-foreground">
          <span>XP: <span className="font-bold text-foreground">{currentXP}</span></span>
          {xpForNextLevel !== null && currentLevel < MAX_LEVEL ? (
            <span>Sgte. Nivel: <span className="font-bold text-foreground">{xpForNextLevel}</span> ({xpToNext} XP)</span>
          ) : (
            <span className="font-bold text-accent">NIVEL MÁXIMO</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Re-add XP_PER_LEVEL_MILESTONES if not exported from game-config, or import it.
// For simplicity, let's assume it's available or correctly imported.
// If getXPForLevel etc. are in game-config, they use XP_PER_LEVEL_MILESTONES from there.

const XP_PER_LEVEL_MILESTONES = [0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 4000, 5000, 6500, 8000, 10000];

