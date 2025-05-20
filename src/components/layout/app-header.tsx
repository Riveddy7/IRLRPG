
"use client";
import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useLifeQuest } from '@/hooks/use-life-quest-store';
import { useAuth } from '@/hooks/use-auth';
import { Flame, Star, ShieldAlert as LevelIcon, LogOut, UserCircle, Loader2, MoreVertical, Settings } from 'lucide-react';
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
          {/* <h1 className="text-2xl font-bold tracking-tight p5-text-shadow ml-2 hidden sm:block">
            LifeQuest RPG
          </h1> */}
        </Link>
        
        <div className="flex items-center space-x-2 sm:space-x-4">
          {authLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : user && player ? (
            <>
              <div className="flex items-center text-sm font-medium" title={`Level ${player.level}`}>
                <LevelIcon className="mr-1 sm:mr-1.5 h-5 w-5 text-accent" />
                <span className="hidden sm:inline">Lvl: </span>{player.level}
              </div>
              <div className="flex items-center text-sm font-medium" title={`XP: ${player.xp}`}>
                <Star className="mr-1 sm:mr-1.5 h-5 w-5 text-yellow-400" />
                <span className="hidden sm:inline">XP: </span>{player.xp}
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 px-2 sm:px-3 py-2 h-auto">
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
                        {player.name || 'Hero'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {/* <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem> */}
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
