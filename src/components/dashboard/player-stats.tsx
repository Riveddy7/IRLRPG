
"use client";
import type { PlayerStats as PlayerStatsType, PlayerSkill } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Zap, HelpCircle, ShieldQuestion, Brain, Gem, HeartPulse, BarChart3, Star } from 'lucide-react';
import { XP_PER_SKILL_LEVEL, MAX_SKILL_LEVEL } from '@/config/game-config';

interface PlayerStatsProps {
  stats: PlayerStatsType;
  statDescriptions?: { [key: string]: string };
}

const genericStatIcons = [Star, HeartPulse, Brain, Gem, Zap, ShieldQuestion, BarChart3];

export function PlayerStats({ stats, statDescriptions }: PlayerStatsProps) {
  const statEntries = Object.entries(stats || {}); // Add fallback for stats

  return (
    <Card className="shadow-lg rounded-lg bg-card/80 backdrop-blur-sm">
      <CardHeader className="p5-panel-header">
        <CardTitle className="text-xl">Mis Habilidades</CardTitle>
      </CardHeader>
      <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
        {statEntries.length === 0 && (
          <p className="text-muted-foreground col-span-full text-center">
            Tus habilidades aún no se han definido. ¡Completa el cuestionario inicial!
          </p>
        )}
        <TooltipProvider>
          {statEntries.map(([statName, skillData], index) => {
            const Icon = genericStatIcons[index % genericStatIcons.length] || HelpCircle;
            const description = statDescriptions?.[statName];
            
            const totalSkillXp = skillData.xp;
            const currentSkillLevel = skillData.level;

            let xpInCurrentLevelView: number;
            let skillProgressPercentage: number;
            let xpDisplayString: string;

            if (currentSkillLevel >= MAX_SKILL_LEVEL) {
              xpInCurrentLevelView = XP_PER_SKILL_LEVEL; // Show full for max level
              skillProgressPercentage = 100;
              xpDisplayString = `${totalSkillXp} Puntos (MAX)`;
            } else {
              // XP relative to the start of the current level
              xpInCurrentLevelView = totalSkillXp - ((currentSkillLevel - 1) * XP_PER_SKILL_LEVEL);
              skillProgressPercentage = (xpInCurrentLevelView / XP_PER_SKILL_LEVEL) * 100;
              xpDisplayString = `${xpInCurrentLevelView} / ${XP_PER_SKILL_LEVEL} Puntos`;
            }
            

            return (
              <Tooltip key={statName} delayDuration={100}>
                <TooltipTrigger asChild>
                  <div className="flex flex-col space-y-2 p-3 bg-muted/30 rounded-md shadow cursor-help">
                    <div className="flex items-center space-x-3">
                      <Icon className="h-8 w-8 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{statName}</p>
                        <p className="p5-stat-value">Etapa {currentSkillLevel}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                       <Progress value={skillProgressPercentage} className="h-2 bg-primary/30 [&>div]:bg-primary" />
                       <p className="text-xs text-muted-foreground text-right">{xpDisplayString}</p>
                    </div>
                  </div>
                </TooltipTrigger>
                {description && (
                  <TooltipContent side="top" className="max-w-xs bg-popover text-popover-foreground p-2 rounded-md shadow-lg">
                    <p className="text-sm font-semibold text-primary">{statName} - Etapa {currentSkillLevel}</p>
                    <p className="text-sm">{description}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}

    