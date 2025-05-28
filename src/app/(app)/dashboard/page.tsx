
"use client";
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { PlayerAvatar } from '@/components/dashboard/player-avatar'; // Used for Desktop and Full Body
import { PlayerStatsRadarChart } from '@/components/dashboard/player-stats-radar-chart';
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
      setAvatarDetails(details); // For headshot
      setFullBodyAvatarDetails(details); // For full body
    }
  }, [player?.genderAvatarKey]);

  const isLoading = lifeQuestLoading || (player && !avatarDetails);


  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Skeleton for Mobile Top Section */}
        <div className="md:hidden space-y-4">
          <Card className="overflow-hidden shadow-xl border-2 border-primary bg-card/90">
            <div className="flex p-3 gap-3">
              <div className="w-1/3 flex flex-col items-center space-y-2 p-2 bg-background/30 rounded-lg">
                <Skeleton className="w-20 h-20 rounded-full" />
                <Skeleton className="h-5 w-16" />
              </div>
              <div className="w-2/3 flex flex-col space-y-2">
                <Skeleton className="h-10 w-full" /> {/* Nickname placeholder */}
                <Skeleton className="h-20 w-full" /> {/* XP Progress placeholder */}
              </div>
            </div>
          </Card>
        </div>

        {/* Skeleton for Desktop Top Section */}
        <div className="hidden md:grid md:grid-cols-3 gap-6 items-start">
          <Skeleton className="h-56 lg:col-span-1 rounded-lg" /> {/* PlayerAvatar placeholder */}
          <div className="md:col-span-2 space-y-6">
            <Skeleton className="h-24 rounded-lg" /> {/* XPProgress placeholder */}
          </div>
        </div>

        {/* Skeleton for Full Body Avatar and Radar Chart */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <Skeleton className="h-72 md:h-96 lg:col-span-1 rounded-lg" /> {/* Full body avatar placeholder */}
          <Skeleton className="h-72 md:h-96 lg:col-span-2 rounded-lg" /> {/* Radar chart placeholder */}
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Error al Cargar Datos del Héroe</h2>
        <p className="text-muted-foreground">No se pudo recuperar la información del jugador.</p>
      </div>
    );
  }
  
  if (player.hasCompletedQuiz === false) {
     return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <AlertTriangle className="w-16 h-16 text-yellow-500 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Iniciación Requerida</h2>
        <p className="text-muted-foreground">Debes completar la forja de tu leyenda antes de acceder al dashboard.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mobile-specific Top Section */}
      <div className="md:hidden space-y-4">
        <Card className="overflow-hidden shadow-xl border-2 border-primary bg-card/90">
          <div className="flex p-3 sm:p-4 gap-3 sm:gap-4 items-stretch">
            {/* Left Column: Avatar + Level */}
            <div className="w-1/3 flex flex-col items-center justify-around p-2 bg-background/30 rounded-lg">
              {avatarDetails ? (
                <Image
                  src={avatarDetails.src}
                  alt={avatarDetails.alt}
                  width={96} 
                  height={96}
                  className="rounded-full border-2 border-accent object-cover aspect-square shadow-md"
                  data-ai-hint={avatarDetails.dataAiHint}
                />
              ) : (
                <Skeleton className="w-20 h-20 sm:w-24 sm:h-24 rounded-full" />
              )}
              <div className="mt-2 text-center">
                <p className="text-xs sm:text-sm font-semibold text-accent flex items-center justify-center">
                  <LevelIcon className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                  Nivel {player.level}
                </p>
              </div>
            </div>

            {/* Right Column: Nickname + XP Progress */}
            <div className="w-2/3 flex flex-col space-y-2 sm:space-y-3 justify-center">
              <div className="p5-panel-header !py-2 !px-3 text-center rounded-md">
                <h2 className="text-base sm:text-lg font-bold text-primary-foreground truncate" title={player.name}>
                  {player.name || <Skeleton className="h-6 w-24 mx-auto" />}
                </h2>
              </div>
              {/* XPProgress is a card itself, so we don't need to wrap it in another red bar unless for specific styling */}
              <XPProgress currentXP={player.xp} currentLevel={player.level} />
            </div>
          </div>
        </Card>
      </div>

      {/* Desktop-specific Top Section */}
      <div className="hidden md:grid md:grid-cols-3 gap-6 items-start">
        <div className="md:col-span-1">
          <PlayerAvatar player={player} /> {/* PlayerAvatar includes name, avatar, and level */}
        </div>
        <div className="md:col-span-2 space-y-6">
          <XPProgress currentXP={player.xp} currentLevel={player.level} />
        </div>
      </div>

      {/* Common Section: Full Body Avatar and Radar Chart */}
      <div className="mt-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          <div className="md:col-span-1 flex justify-center items-center md:h-96">
            {fullBodyAvatarDetails ? (
              <div className="relative w-52 h-96 sm:w-60 md:w-auto md:h-full max-h-[480px]">
                <Image
                  src={fullBodyAvatarDetails.fullBodySrc}
                  alt={`${player.name} - Full Body`}
                  layout="fill"
                  objectFit="contain"
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
                  <CardTitle>Atributos Primordiales</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-48">
                  <p className="text-muted-foreground">Atributos no disponibles.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
