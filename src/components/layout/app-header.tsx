
"use client";
import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useLifeQuest } from '@/hooks/use-life-quest-store';
import { useAuth } from '@/hooks/use-auth';
import { Flame, Star, ShieldAlert as LevelIcon, LogOut, UserCircle, Loader2, Coins } from 'lucide-react'; // Added Coins
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AppHeader() {
  const { player } = useLifeQuest();
  const { user, logoutUser, isLoading: authLoading } = useAuth();

  const handleLogout = async () => {
    await logoutUser();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="flex items-center" aria-label="Dashboard">
          <Flame className="h-8 w-8 text-primary" />
        </Link>
        
        <div className="flex items-center space-x-2 sm:space-x-3">
          {authLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : user && player ? (
            <>
              <div className="flex items-center text-xs sm:text-sm font-medium p-1 sm:p-1.5 bg-card/50 rounded-md shadow" title={`Nivel ${player.level}`}>
                <LevelIcon className="mr-1 h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                <span className="hidden sm:inline">Lvl: </span>{player.level}
              </div>
              <div className="flex items-center text-xs sm:text-sm font-medium p-1 sm:p-1.5 bg-card/50 rounded-md shadow" title={`XP: ${player.xp}`}>
                <Star className="mr-1 h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
                <span className="hidden sm:inline">XP: </span>{player.xp}
              </div>
              <div className="flex items-center text-xs sm:text-sm font-medium p-1 sm:p-1.5 bg-card/50 rounded-md shadow" title={`Monedas: ${player.coins}`}>
                <Coins className="mr-1 h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                <span className="hidden sm:inline">$: </span>{player.coins}
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-1 sm:space-x-2 px-1.5 py-1 sm:px-3 sm:py-2 h-auto rounded-md hover:bg-accent/20">
                    <UserCircle className="h-6 w-6 sm:h-5 sm:w-5 text-foreground" />
                    <span className="hidden md:inline text-sm font-medium">
                      {player.name || user.email?.split('@')[0]}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {player.name || 'Héroe'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            null 
          )}
        </div>
      </div>
    </header>
  );
}
