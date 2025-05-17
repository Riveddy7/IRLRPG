
"use client";
import type { PlayerStats as PlayerStatsType, Player } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Zap, HelpCircle, ShieldQuestion, Brain, Gem, HeartPulse, BarChart3 } from 'lucide-react'; // Algunos iconos de ejemplo

interface PlayerStatsProps {
  stats: PlayerStatsType;
  statDescriptions?: { [key: string]: string }; // Opcional, para tooltips
}

// Mapeo básico de iconos genéricos o por categoría si se desea.
// Para stats 100% dinámicos, es difícil tener un icono único para cada uno.
// Podríamos usar un conjunto de iconos y asignarlos cíclicamente o basándonos en keywords si las tuviéramos.
// Por ahora, un icono genérico o una selección limitada.
const genericStatIcons = [BarChart3, HeartPulse, Brain, Gem, Zap, ShieldQuestion];

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
          {statEntries.map(([statName, value], index) => {
            const Icon = genericStatIcons[index % genericStatIcons.length] || HelpCircle;
            const description = statDescriptions?.[statName];
            return (
              <Tooltip key={statName} delayDuration={100}>
                <TooltipTrigger asChild>
                  <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-md shadow cursor-help">
                    <Icon className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{statName}</p>
                      <p className="p5-stat-value">{value}</p>
                    </div>
                  </div>
                </TooltipTrigger>
                {description && (
                  <TooltipContent side="top" className="max-w-xs bg-popover text-popover-foreground p-2 rounded-md shadow-lg">
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
