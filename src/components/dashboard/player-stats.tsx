
"use client";
import type { PlayerStats as PlayerStatsType, PlayerSkill } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Zap, HelpCircle, ShieldQuestion, Brain, Gem, HeartPulse, BarChart3, Star } from 'lucide-react';
import { XP_PER_SKILL_LEVEL } from '@/config/game-config';

interface PlayerStatsProps {
  stats: PlayerStatsType;
  statDescriptions?: { [key: string]: string };
}

const genericStatIcons = [Star, HeartPulse, Brain, Gem, Zap, ShieldQuestion, BarChart3];

export function PlayerStats({ stats, statDescriptions }: PlayerStatsProps) {
  const statEntries = Object.entries(stats);

  return (
    <Card className="shadow-lg rounded-lg bg-card/80 backdrop-blur-sm">
      <CardHeader className="p5-panel-header">
        <CardTitle className="text-xl">Atributos Primordiales</CardTitle>
      </CardHeader>
      <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
        {statEntries.length === 0 && (
          <p className="text-muted-foreground col-span-full text-center">
            Los atributos aún no han sido revelados. ¡Completa tu iniciación!
          </p>
        )}
        <TooltipProvider>
          {statEntries.map(([statName, skillData], index) => {
            const Icon = genericStatIcons[index % genericStatIcons.length] || HelpCircle;
            const description = statDescriptions?.[statName];
            const skillProgress = skillData.xp < XP_PER_SKILL_LEVEL ? (skillData.xp / XP_PER_SKILL_LEVEL) * 100 : 100;

            return (
              <Tooltip key={statName} delayDuration={100}>
                <TooltipTrigger asChild>
                  <div className="flex flex-col space-y-2 p-3 bg-muted/30 rounded-md shadow cursor-help">
                    <div className="flex items-center space-x-3">
                      <Icon className="h-8 w-8 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{statName}</p>
                        <p className="p5-stat-value">Nivel {skillData.level}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                       <Progress value={skillProgress} className="h-2 bg-primary/30 [&>div]:bg-primary" />
                       <p className="text-xs text-muted-foreground text-right">{skillData.xp} / {XP_PER_SKILL_LEVEL} XP</p>
                    </div>
                  </div>
                </TooltipTrigger>
                {description && (
                  <TooltipContent side="top" className="max-w-xs bg-popover text-popover-foreground p-2 rounded-md shadow-lg">
                    <p className="text-sm font-semibold text-primary">{statName} - Nivel {skillData.level}</p>
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
