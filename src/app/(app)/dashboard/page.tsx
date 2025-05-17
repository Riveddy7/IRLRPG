
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
    // Esto podría ocurrir si el quiz no se ha completado o hay un error cargando el jugador.
    // AppLayout debería redirigir al quiz si es necesario.
    // Si llega aquí, es un estado inesperado o el jugador aún no se ha creado/cargado completamente.
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Error al Cargar Datos del Héroe</h2>
        <p className="text-muted-foreground">No se pudo recuperar la información del jugador. Si es tu primera vez, serás redirigido para crear tu personaje.</p>
      </div>
    );
  }
  
  if (player.hasCompletedQuiz === false) {
    // Aunque AppLayout debería manejar esto, una doble verificación aquí.
    // Podría mostrar un mensaje o un loader mientras redirige.
     return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <AlertTriangle className="w-16 h-16 text-yellow-500 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Iniciación Requerida</h2>
        <p className="text-muted-foreground">Debes completar la forja de tu leyenda antes de acceder al dashboard.</p>
        {/* Un botón para ir al quiz podría ser útil si la redirección falla. */}
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
          <PlayerStats stats={player.stats} statDescriptions={player.statDescriptions} />
        </div>
      </div>
    </div>
  );
}
