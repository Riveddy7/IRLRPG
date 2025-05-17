"use client";
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Player } from '@/types';
import { ShieldAlert as LevelIcon } from 'lucide-react';

interface PlayerAvatarProps {
  player: Player;
}

export function PlayerAvatar({ player }: PlayerAvatarProps) {
  return (
    <Card className="w-full shadow-xl border-primary border-2 rounded-lg overflow-hidden bg-card/80 backdrop-blur-sm">
      <CardHeader className="p5-panel-header items-center text-center !pb-2 !pt-4">
        <CardTitle className="text-2xl">{player.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center p-6 space-y-4">
        <div className="relative h-32 w-32 rounded-full overflow-hidden border-4 border-accent shadow-lg">
          <Image
            src={player.avatarUrl}
            alt={`${player.name}'s avatar`}
            layout="fill"
            objectFit="cover"
            data-ai-hint={player.dataAiHint || "character avatar"}
          />
        </div>
        <div className="flex items-center text-xl font-semibold text-accent">
          <LevelIcon className="mr-2 h-6 w-6" />
          Level {player.level}
        </div>
      </CardContent>
    </Card>
  );
}
