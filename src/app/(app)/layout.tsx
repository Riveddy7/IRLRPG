
"use client";
import { AppHeader } from '@/components/layout/app-header';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { useAuth } from '@/hooks/use-auth';
import { useLifeQuest } from '@/hooks/use-life-quest-store';
import { useRouter, usePathname } from 'next/navigation'; // Import usePathname
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
  const pathname = usePathname(); // Get current pathname

  useEffect(() => {
    const totalLoading = authLoading || lifeQuestLoading;
    
    if (!totalLoading) { // Solo actuar cuando ambas cargas hayan terminado
      if (!user) {
        router.replace('/login');
      } else {
        // User is logged in
        if (player && player.hasCompletedQuiz === false) {
          if (pathname !== '/quiz') { // Solo redirigir si no estamos ya en /quiz
            router.replace('/quiz');
          }
        } else if (player && player.hasCompletedQuiz === true && pathname === '/quiz') {
          // Si el quiz está completo y el usuario de alguna manera llega a /quiz, redirigir al dashboard
          router.replace('/dashboard');
        }
        // Si player es null al principio (después de que authLoading y lifeQuestLoading sean false),
        // es un estado transitorio. createNewPlayerDocument se habrá llamado desde useAuth.
        // El onSnapshot en useLifeQuestStore actualizará el estado de `player`,
        // y este useEffect se ejecutará de nuevo.
      }
    }
  }, [user, player, authLoading, lifeQuestLoading, router, pathname]); // Añadido pathname a las dependencias

  // Cargador principal mientras se autentica o se cargan los datos iniciales del jugador
  // Evita mostrar este cargador en las propias páginas de autenticación si el usuario es momentáneamente nulo
  if (authLoading || lifeQuestLoading || (!user && pathname !== '/login' && pathname !== '/register')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-xl font-semibold">Cargando tu Legado...</p>
        <p className="text-sm text-muted-foreground">Forjando tu destino...</p>
      </div>
    );
  }
  
  // Si el usuario está autenticado, los datos del jugador están cargados,
  // el quiz no se ha completado, Y NO ESTAMOS YA EN LA PÁGINA DEL QUIZ,
  // entonces muestra el cargador de "Preparando tu Iniciación..."
  // Esto cubre el momento justo antes de que la redirección del useEffect surta efecto.
  if (user && player && player.hasCompletedQuiz === false && pathname !== '/quiz') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-xl font-semibold">Preparando tu Iniciación...</p>
        <p className="text-sm text-muted-foreground">Serás redirigido al ritual de personalización.</p>
      </div>
    );
  }

  // Si todas las comprobaciones anteriores se superan (o no aplican), renderiza el layout principal con los children.
  // Esto incluye:
  // - Usuario autenticado, quiz completado -> renderiza la página solicitada (ej. dashboard)
  // - Usuario autenticado, quiz no completado, PERO pathname YA ES '/quiz' -> renderiza QuizPage
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      <div className="flex flex-1">
        <AppSidebar />
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="container mx-auto max-w-7xl">
             {children}
          </div>
        </main>
      </div>
    </div>
  );
}
