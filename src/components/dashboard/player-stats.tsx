"use client";
import type { PlayerStats as PlayerStatsType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Brain, Gem, HeartPulse, ShieldQuestion, Zap } from 'lucide-react'; // Using Gem for Charm, Zap for Focus
import { STAT_NAMES } from '@/config/game-config';

interface PlayerStatsProps {
  stats: PlayerStatsType;
}

const statIcons: { [key in keyof PlayerStatsType]: React.ElementType } = {
  power: BarChart3,
  guts: HeartPulse,
  intel: Brain,
  charm: Gem,
  focus: Zap,
};

export function PlayerStats({ stats }: PlayerStatsProps) {
  return (
    <Card className="shadow-lg rounded-lg bg-card/80 backdrop-blur-sm">
      <CardHeader className="p5-panel-header">
        <CardTitle className="text-xl">Core Attributes</CardTitle>
      </CardHeader>
      <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
        {Object.entries(stats).map(([key, value]) => {
          const Icon = statIcons[key as keyof PlayerStatsType] || ShieldQuestion;
          const statName = STAT_NAMES[key] || key.charAt(0).toUpperCase() + key.slice(1);
          return (
            <div key={key} className="flex items-center space-x-3 p-3 bg-muted/30 rounded-md shadow">
              <Icon className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{statName}</p>
                <p className="p5-stat-value">{value}</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
