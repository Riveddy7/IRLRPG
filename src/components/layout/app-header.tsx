
"use client";
import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useLifeQuest } from '@/hooks/use-life-quest-store';
import { useAuth } from '@/hooks/use-auth'; // Import useAuth
import { Flame, Star, ShieldAlert as LevelIcon, LogOut, UserCircle, Loader2 } from 'lucide-react';

export function AppHeader() {
  const { player } = useLifeQuest(); // Player data from LifeQuest store
  const { user, logoutUser, isLoading: authLoading } = useAuth(); // Auth user and logout function

  const handleLogout = async () => {
    await logoutUser();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="flex items-center">
          <Flame className="h-8 w-8 text-primary mr-2" />
          <h1 className="text-2xl font-bold tracking-tight p5-text-shadow">
            LifeQuest RPG
          </h1>
        </Link>
        
        <div className="flex items-center space-x-4">
          {authLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : user && player ? (
            <>
              <div className="flex items-center text-sm font-medium" title={`Level ${player.level}`}>
                <LevelIcon className="mr-1.5 h-5 w-5 text-accent" />
                Lvl: {player.level}
              </div>
              <div className="flex items-center text-sm font-medium" title={`XP: ${player.xp}`}>
                <Star className="mr-1.5 h-5 w-5 text-yellow-400" />
                XP: {player.xp}
              </div>
              <div className="flex items-center text-sm font-medium">
                 <UserCircle className="mr-1.5 h-5 w-5 text-foreground" />
                 {player.name || user.email?.split('@')[0]}
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="hover:bg-destructive/80 hover:text-destructive-foreground">
                <LogOut className="mr-1.5 h-4 w-4" />
                Logout
              </Button>
            </>
          ) : (
            // Optionally show login/register buttons if not in auth pages
            // For now, assuming redirection handles this
            null 
          )}
        </div>
      </div>
    </header>
  );
}
