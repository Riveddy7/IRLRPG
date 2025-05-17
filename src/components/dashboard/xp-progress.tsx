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

  if (currentLevel < MAX_LEVEL && xpForNextLevel !== null) {
    const totalXPForThisLevelRange = xpForNextLevel - xpForCurrentLevel;
    const xpEarnedInThisLevelRange = currentXP - xpForCurrentLevel;
    progressPercentage = totalXPForThisLevelRange > 0 ? (xpEarnedInThisLevelRange / totalXPForThisLevelRange) * 100 : 100;
    xpToNext = totalXPForThisLevelRange - xpEarnedInThisLevelRange;
  } else {
    // Max level reached
    progressPercentage = 100;
  }

  return (
    <Card className="shadow-lg rounded-lg bg-card/80 backdrop-blur-sm">
      <CardHeader className="p5-panel-header !pb-2">
        <CardTitle className="text-xl flex items-center">
          <Star className="mr-2 h-5 w-5"/>
          Experience Points
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-3">
        <Progress value={progressPercentage} className="w-full h-4 bg-primary/30 [&>div]:bg-primary" />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Current XP: <span className="font-bold text-foreground">{currentXP}</span></span>
          {xpForNextLevel !== null && xpToNext !== null && currentLevel < MAX_LEVEL ? (
            <span>Next Level: <span className="font-bold text-foreground">{xpForNextLevel}</span> ({xpToNext} XP to go)</span>
          ) : (
            <span className="font-bold text-accent">MAX LEVEL REACHED!</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
