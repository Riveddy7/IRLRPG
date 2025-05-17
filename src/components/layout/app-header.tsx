"use client";
import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useLifeQuest } from '@/hooks/use-life-quest-store';
import {Flame, Star, ShieldAlert as LevelIcon } from 'lucide-react'; // Using ShieldAlert as level icon

export function AppHeader() {
  const { player } = useLifeQuest();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="flex items-center">
          <Flame className="h-8 w-8 text-primary mr-2" /> {/* App Icon */}
          <h1 className="text-2xl font-bold tracking-tight p5-text-shadow">
            LifeQuest RPG
          </h1>
        </Link>
        {player && (
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-sm font-medium">
              <LevelIcon className="mr-1.5 h-5 w-5 text-accent" />
              Lvl: {player.level}
            </div>
            <div className="flex items-center text-sm font-medium">
              <Star className="mr-1.5 h-5 w-5 text-yellow-400" />
              XP: {player.xp}
            </div>
            <span className="font-semibold text-primary-foreground">{player.name}</span>
          </div>
        )}
      </div>
    </header>
  );
}
