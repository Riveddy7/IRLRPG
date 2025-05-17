
"use client";
import { AppHeader } from '@/components/layout/app-header';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { useAuth } from '@/hooks/use-auth';
import { useLifeQuest } from '@/hooks/use-life-quest-store'; // Necesitamos player para verificar el quiz
import { useRouter } from 'next/navigation';
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

  useEffect(() => {
    const totalLoading = authLoading || lifeQuestLoading;
    
    if (!totalLoading) { // Solo actuar cuando ambas cargas hayan terminado
      if (!user) {
        router.replace('/login');
      } else if (user && player === null) {
        // Esto puede pasar si el documento del jugador aún no se carga o no existe.
        // Si createNewPlayerDocument de useAuth ya se ejecutó, player tendrá hasCompletedQuiz.
        // Si player es null y user existe, podría ser un estado transitorio o un error.
        // Podríamos esperar un poco o redirigir al quiz como fallback si hasCompletedQuiz no está disponible.
        // Por ahora, si player es null pero user existe, y el quiz no se ha completado, se asume que debe ir al quiz.
        // La lógica más robusta es: si player existe Y player.hasCompletedQuiz es false.
        // Si el jugador no existe en Firestore pero sí en Auth, es un caso que createNewPlayerDocument debería haber manejado.
        // Para ser más directos:
      } else if (user && player && player.hasCompletedQuiz === false) {
        router.replace('/quiz');
      }
      // Si user existe, player existe y player.hasCompletedQuiz es true, se queda en la página actual (children)
    }
  }, [user, player, authLoading, lifeQuestLoading, router]);

  if (authLoading || lifeQuestLoading || !user) { // Muestra carga si auth o datos de lifequest están cargando, o si no hay usuario (antes de la redirección)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-xl font-semibold">Cargando tu Legado...</p>
        <p className="text-sm text-muted-foreground">Forjando tu destino...</p>
      </div>
    );
  }
  
  // Si el jugador existe pero no ha completado el quiz, y la redirección aún no ha ocurrido (useEffect tiene dependencias)
  // podríamos mostrar un loader específico para "Redirigiendo al quiz"
  if (player && player.hasCompletedQuiz === false) {
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
