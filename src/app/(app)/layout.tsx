
"use client";
import { AppHeader } from '@/components/layout/app-header';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppBottomNav } from '@/components/layout/app-bottom-nav'; // Importar AppBottomNav
import { useAuth } from '@/hooks/use-auth';
import { useLifeQuest } from '@/hooks/use-life-quest-store';
import { useRouter, usePathname } from 'next/navigation';
import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading: authLoading } = useAuth();
  const { player, isLoading: lifeQuestLoading } = useLifeQuest();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const totalLoading = authLoading || lifeQuestLoading;
    
    if (!totalLoading) {
      if (!user) {
        router.replace('/login');
      } else {
        if (player && player.hasCompletedQuiz === false) {
          if (pathname !== '/quiz') {
            router.replace('/quiz');
          }
        } else if (player && player.hasCompletedQuiz === true && pathname === '/quiz') {
          router.replace('/dashboard');
        }
      }
    }
  }, [user, player, authLoading, lifeQuestLoading, router, pathname]);

  if (authLoading || lifeQuestLoading || (!user && pathname !== '/login' && pathname !== '/register')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-xl font-semibold">Cargando tu Legado...</p>
        <p className="text-sm text-muted-foreground">Forjando tu destino...</p>
      </div>
    );
  }
  
  if (user && player && player.hasCompletedQuiz === false && pathname !== '/quiz') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-xl font-semibold">Preparando tu Iniciación...</p>
        <p className="text-sm text-muted-foreground">Serás redirigido al ritual de personalización.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      <div className="flex flex-1">
        <AppSidebar /> {/* Se oculta en móvil por sus propias clases 'hidden md:flex' */}
        <main className="flex-1 p-6 pb-20 md:pb-6 overflow-y-auto"> {/* Padding inferior para la barra en móvil */}
          <div className="container mx-auto max-w-7xl">
             {children}
          </div>
        </main>
      </div>
      <AppBottomNav /> {/* Se muestra solo en móvil por sus clases 'md:hidden' */}
    </div>
  );
}
