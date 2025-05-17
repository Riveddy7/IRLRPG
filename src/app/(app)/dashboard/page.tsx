"use client";
import { PlayerAvatar } from '@/components/dashboard/player-avatar';
import { PlayerStats } from '@/components/dashboard/player-stats';
import { XPProgress } from '@/components/dashboard/xp-progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useLifeQuest } from '@/hooks/use-life-quest-store';
import { AlertTriangle } from 'lucide-react';

export default function DashboardPage() {
  const { player, isLoading } = useLifeQuest();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 lg:col-span-1 rounded-lg" />
          <Skeleton className="h-64 lg:col-span-2 rounded-lg" />
        </div>
        <Skeleton className="h-48 rounded-lg" />
      </div>
    );
  }

  if (!player) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Error Loading Player Data</h2>
        <p className="text-muted-foreground">Could not retrieve player information. Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        <div className="md:col-span-1 space-y-6">
          <PlayerAvatar player={player} />
        </div>
        <div className="md:col-span-2 space-y-6">
          <XPProgress currentXP={player.xp} currentLevel={player.level} />
          <PlayerStats stats={player.stats} />
        </div>
      </div>
       {/* Placeholder for Persona 5 style dynamic elements or quick actions */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p5-angled-bg">
          <CardHeader className="p5-panel-header"><CardTitle>Quick Actions</CardTitle></CardHeader>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Space for quick mission/habit add.</p>
          </CardContent>
        </Card>
        <Card className="p5-angled-bg">
          <CardHeader className="p5-panel-header"><CardTitle>Recent Activity</CardTitle></CardHeader>
          <CardContent className="p-6">
             <p className="text-muted-foreground">Log of recent achievements.</p>
          </CardContent>
        </Card>
      </div> */}
    </div>
  );
}
