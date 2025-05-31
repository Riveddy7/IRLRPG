
"use client";
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { PlayerAvatar } from '@/components/dashboard/player-avatar'; // Used for Desktop and Full Body (if kept)
import { PlayerStatsRadarChart } from '@/components/dashboard/player-stats-radar-chart'; // Desktop only
import { PlayerStats } from '@/components/dashboard/player-stats'; // Mobile list view
import { XPProgress } from '@/components/dashboard/xp-progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useLifeQuest } from '@/hooks/use-life-quest-store';
import { AlertTriangle, ShieldAlert as LevelIcon, UserCircle } from 'lucide-react';
import { getAvatarDetails, type AvatarOption } from '@/config/avatar-config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  const { player, isLoading: lifeQuestLoading } = useLifeQuest();
  const [avatarDetails, setAvatarDetails] = useState<AvatarOption | null>(null);
  const [fullBodyAvatarDetails, setFullBodyAvatarDetails] = useState<AvatarOption | null>(null);

  useEffect(() => {
    if (player?.genderAvatarKey) {
      const details = getAvatarDetails(player.genderAvatarKey);
      setAvatarDetails(details);
      setFullBodyAvatarDetails(details);
    }
  }, [player?.genderAvatarKey]);

  const isLoading = lifeQuestLoading || (player && !avatarDetails);


  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Skeleton for Mobile Top Section */}
        <div className="md:hidden space-y-4">
          <div className="flex items-center gap-x-4">
            <div className="flex-shrink-0">
              <Skeleton className="w-28 h-28 sm:w-32 sm:h-32 rounded-lg" />
            </div>
            <div className="flex-grow space-y-2">
              <Skeleton className="h-8 w-3/4" /> {/* Nickname */}
              <Skeleton className="h-6 w-1/2" /> {/* Level */}
            </div>
          </div>
          <div>
            <Skeleton className="h-8 w-full" /> {/* XP Progress placeholder */}
          </div>
        </div>

        {/* Skeleton for Desktop Top Section */}
        <div className="hidden md:grid md:grid-cols-3 gap-6 items-start">
          <Skeleton className="h-56 lg:col-span-1 rounded-lg" /> {/* PlayerAvatar placeholder */}
          <div className="md:col-span-2 space-y-6">
            <Skeleton className="h-24 rounded-lg" /> {/* XPProgress placeholder */}
          </div>
        </div>

        {/* Skeleton for Content Below Top Section */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-start"> {/* Changed items-center to items-start */}
           {/* Mobile: Skills List Skeleton */}
          <div className="md:hidden col-span-1">
            <Skeleton className="h-72 w-full rounded-lg" />
          </div>
          {/* Desktop: Full Body Avatar and Radar Chart Skeletons */}
          <Skeleton className="h-72 md:h-96 lg:col-span-1 rounded-lg hidden md:block" /> {/* Full body avatar placeholder */}
          <Skeleton className="h-72 md:h-96 lg:col-span-2 rounded-lg hidden md:block" /> {/* Radar chart placeholder */}
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Error al Cargar Datos del Perfil</h2>
        <p className="text-muted-foreground">No se pudo recuperar la información del jugador.</p>
      </div>
    );
  }
  
  if (player.hasCompletedQuiz === false) {
     return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <AlertTriangle className="w-16 h-16 text-yellow-500 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Configuración Inicial Requerida</h2>
        <p className="text-muted-foreground">Debes completar la configuración de tu perfil antes de acceder al panel.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8"> {/* Increased general spacing */}
      {/* Mobile-specific Top Section */}
      <div className="md:hidden space-y-4">
        <div className="flex items-center gap-x-4">
          <div className="flex-shrink-0">
            {avatarDetails ? (
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-lg overflow-hidden border-2 border-accent relative animate-idle-bob shadow-lg">
                <Image
                  src={avatarDetails.src}
                  alt={avatarDetails.alt}
                  layout="fill"
                  objectFit="cover"
                  data-ai-hint={avatarDetails.dataAiHint}
                  priority
                />
              </div>
            ) : (
              <Skeleton className="w-28 h-28 sm:w-32 sm:h-32 rounded-lg" />
            )}
          </div>
          <div className="flex-grow flex flex-col justify-center min-w-0"> {/* min-w-0 helps with truncation */}
            <h2 className="text-2xl sm:text-3xl font-bold text-primary truncate" title={player.name}>
              {player.name || <Skeleton className="h-8 w-3/4" />}
            </h2>
             <p className="text-sm sm:text-base text-primary flex items-center"> {/* Changed text-accent to text-primary */}
                <LevelIcon className="mr-1.5 h-4 w-4 sm:h-5 sm:w-5" /> {/* Slightly larger icon and margin */}
                Nivel {player.level}
            </p>
          </div>
        </div>
        <div className="pt-1"> 
          <XPProgress currentXP={player.xp} currentLevel={player.level} />
        </div>
      </div>

      {/* Desktop-specific Top Section */}
      <div className="hidden md:grid md:grid-cols-3 gap-6 items-start">
        <div className="md:col-span-1">
          <PlayerAvatar player={player} /> 
        </div>
        <div className="md:col-span-2 space-y-6">
          <XPProgress currentXP={player.xp} currentLevel={player.level} />
        </div>
      </div>

      {/* Mobile: Skills List */}
      <div className="md:hidden mt-6">
        <PlayerStats stats={player.stats} statDescriptions={player.statDescriptions}/>
      </div>

      {/* Desktop: Full Body Avatar and Radar Chart */}
      <div className="hidden md:grid md:grid-cols-3 gap-8 items-start mt-6"> {/* Changed items-center to items-start */}
          <div className="md:col-span-1 flex justify-center items-center md:h-96">
            {fullBodyAvatarDetails ? (
              <div className="relative w-52 h-96 sm:w-60 md:w-auto md:h-full max-h-[480px]"> {/* md:h-full for better scaling */}
                <Image
                  src={fullBodyAvatarDetails.fullBodySrc}
                  alt={`${player.name || 'Avatar'} - Cuerpo Completo`}
                  layout="fill"
                  objectFit="contain" // Changed to contain
                  className="animate-idle-bob"
                  data-ai-hint={fullBodyAvatarDetails.fullBodyDataAiHint}
                  priority
                />
              </div>
            ) : (
              <Skeleton className="w-52 h-96 sm:w-60 rounded-lg" />
            )}
          </div>
          <div className="md:col-span-2">
            {player.stats && Object.keys(player.stats).length > 0 ? (
              <PlayerStatsRadarChart stats={player.stats} statDescriptions={player.statDescriptions}/>
            ) : (
              <Card className="p5-radar-chart-container">
                <CardHeader className="p5-panel-header">
                  <CardTitle>Atributos Clave</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-48">
                  <p className="text-muted-foreground">Atributos no disponibles.</p>
                </CardContent>
              </Card>
            )}
          </div>
      </div>
      {player.characterPreamble && (
        <Card className="mt-6 bg-card/80 backdrop-blur-sm">
            <CardHeader className="p5-panel-header">
                <CardTitle className="text-lg">Tu Enfoque Personal</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground italic">"{player.characterPreamble}"</p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
