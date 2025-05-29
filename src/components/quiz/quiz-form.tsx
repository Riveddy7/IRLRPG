
"use client";

import React, { useState, useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Loader2, Sparkles, AlertTriangle, UserCheck, BookOpen, Dices, ChevronLeft, ChevronRight } from "lucide-react";
import { useLifeQuest } from '@/hooks/use-life-quest-store';
import { useRouter } from 'next/navigation';
import { generatePlayerStats, type GeneratePlayerStatsInput, type GeneratePlayerStatsOutput } from '@/ai/flows/generate-player-stats-flow';
import type { Player, PlayerStats as PlayerStatsType, PlayerSkill } from '@/types';
import { avatarOptions } from '@/config/avatar-config';
import { cn } from '@/lib/utils';

const quizFormSchema = z.object({
  nickname: z.string().min(3, "Tu nombre debe tener al menos 3 caracteres.").max(50, "El nombre es demasiado largo."),
  age: z.coerce.number().min(1, "Debes indicar tu edad.").max(150, "Verifica la edad ingresada."),
  genderAvatarKey: z.string().min(1, "Debes elegir un avatar."),
  improvementAreas: z.string().min(20, "Describe tus objetivos con un poco más de detalle (mínimo 20 caracteres).").max(1000, "Intenta ser conciso en tu descripción."),
});

type QuizFormValues = z.infer<typeof quizFormSchema>;

export function QuizForm() {
  const { updatePlayerProfileAfterQuiz, player } = useLifeQuest();
  const router = useRouter();
  const [isGeneratingStats, setIsGeneratingStats] = useState(false);
  const [generatedAIData, setGeneratedAIData] = useState<GeneratePlayerStatsOutput | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [currentAvatarIndex, setCurrentAvatarIndex] = useState(0);

  const form = useForm<QuizFormValues>({
    resolver: zodResolver(quizFormSchema),
    defaultValues: {
      nickname: player?.name && player.name !== "Principiante" ? player.name : "",
      age: player?.age || undefined,
      genderAvatarKey: player?.genderAvatarKey || avatarOptions[0].key, // Default to first avatar's key
      improvementAreas: player?.improvementAreas || "",
    },
  });
  
  useEffect(() => {
    if (player?.hasCompletedQuiz) {
      router.replace('/dashboard');
    }
  }, [player, router]);

  useEffect(() => {
    const initialKey = form.getValues("genderAvatarKey");
    if (initialKey) {
      const initialIndex = avatarOptions.findIndex(opt => opt.key === initialKey);
      if (initialIndex !== -1) {
        setCurrentAvatarIndex(initialIndex);
      }
    } else if (avatarOptions.length > 0) {
      // Set initial form value if not already set and options are available
      form.setValue("genderAvatarKey", avatarOptions[0].key);
      setCurrentAvatarIndex(0);
    }
  }, [form]);


  const handleGenerateStats = async () => {
    const improvementAreas = form.getValues("improvementAreas");
    if (!improvementAreas || improvementAreas.length < 20) {
      form.setError("improvementAreas", { type: "manual", message: "Por favor, describe tus aspiraciones con más detalle (mínimo 20 caracteres)." });
      return;
    }
    setIsGeneratingStats(true);
    setAiError(null);
    setGeneratedAIData(null);
    try {
      const input: GeneratePlayerStatsInput = { aspirations: improvementAreas };
      const result = await generatePlayerStats(input);
      setGeneratedAIData(result);
    } catch (error: any) {
      console.error("Error generando stats AI:", error);
      let message = "Hubo un error al procesar tu solicitud. Inténtalo de nuevo en un momento.";
      // Retain specific error for format mismatch, but make it more user-friendly
      if (error.message?.includes("La IA no pudo generar los atributos del jugador según el formato esperado.")) {
        message = "Hubo un error al generar tus estadísticas con el formato esperado. Intenta reformular tus metas o contacta a soporte si persiste.";
      } else if (error.message && !error.message.includes("El Oráculo está meditando")) { // Avoid generic AI error messages if a more specific one is present
        // Potentially keep more specific AI errors if they are user-friendly, otherwise use the generic one
        // For now, let's use the generic one for simplicity unless it's the format error.
      }
      if (error.cause) console.error("Causa del error:", error.cause);
      setAiError(message);
    } finally {
      setIsGeneratingStats(false);
    }
  };

  async function onSubmit(data: QuizFormValues) {
    if (!generatedAIData) {
      setAiError("Primero debes generar tus estadísticas iniciales.");
      return;
    }
    setIsSubmitting(true);

    const initialPlayerStats: PlayerStatsType = {};
    const newStatDescriptions: { [key: string]: string } = {};
    
    generatedAIData.stats.forEach(stat => {
      initialPlayerStats[stat.name] = { xp: 0, level: 1 }; 
      newStatDescriptions[stat.name] = stat.description;
    });

    const profileUpdate: Partial<Player> = {
      name: data.nickname,
      age: data.age,
      genderAvatarKey: data.genderAvatarKey,
      improvementAreas: data.improvementAreas,
      stats: initialPlayerStats, 
      statDescriptions: newStatDescriptions,
    };
    
    await updatePlayerProfileAfterQuiz(profileUpdate);
    setIsSubmitting(false);
    router.push('/dashboard'); 
  }

  const totalAvatars = avatarOptions.length;
  const handleNextAvatar = () => {
    const nextIndex = (currentAvatarIndex + 1) % totalAvatars;
    setCurrentAvatarIndex(nextIndex);
    form.setValue("genderAvatarKey", avatarOptions[nextIndex].key, { shouldValidate: true });
  };
  const handlePrevAvatar = () => {
    const prevIndex = (currentAvatarIndex - 1 + totalAvatars) % totalAvatars;
    setCurrentAvatarIndex(prevIndex);
    form.setValue("genderAvatarKey", avatarOptions[prevIndex].key, { shouldValidate: true });
  };


  if (player === undefined) { 
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Cargando información...</p>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto bg-card/80 backdrop-blur-sm shadow-2xl border-primary/50">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl p5-text-shadow flex items-center justify-center"><UserCheck className="mr-3 h-8 w-8" /> Completa tu Perfil</CardTitle>
        <CardDescription>Define tus datos iniciales para personalizar tu experiencia.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="nickname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg">Tu Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: 'El Intrépido'" {...field} className="text-base" />
                  </FormControl>
                  <FormDescription>Este es el nombre que se mostrará en la aplicación.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="age"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg">Tu Edad</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Ej: 25" {...field} className="text-base" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="genderAvatarKey"
              render={({ field }) => ( // field is implicitly used by form.setValue
                <FormItem className="space-y-3">
                  <FormLabel className="text-lg text-center block">Elige tu avatar</FormLabel>
                  <FormControl>
                    <div className="flex items-center justify-center space-x-2 sm:space-x-4">
                      <Button type="button" variant="outline" size="icon" onClick={handlePrevAvatar} aria-label="Avatar anterior">
                        <ChevronLeft className="h-6 w-6" />
                      </Button>
                      
                      <div className="relative w-52 h-96 sm:w-60 sm:h-[340px] overflow-hidden rounded-lg shadow-lg border-2 border-primary bg-muted/30 flex items-center justify-center">
                        {avatarOptions.length > 0 && (
                          <Image
                            key={avatarOptions[currentAvatarIndex].key} // Add key for re-renders
                            src={avatarOptions[currentAvatarIndex].fullBodySrc}
                            alt={avatarOptions[currentAvatarIndex].alt}
                            width={270} // Original width for 9:16
                            height={480} // Original height for 9:16
                            className="object-contain h-full w-auto animate-idle-bob" // Use object-contain to see full image
                            data-ai-hint={avatarOptions[currentAvatarIndex].fullBodyDataAiHint}
                            priority // Preload the current avatar image
                          />
                        )}
                      </div>
                      
                      <Button type="button" variant="outline" size="icon" onClick={handleNextAvatar} aria-label="Siguiente avatar">
                        <ChevronRight className="h-6 w-6" />
                      </Button>
                    </div>
                  </FormControl>
                  {avatarOptions.length > 0 && (
                     <p className="text-center text-muted-foreground font-medium">{avatarOptions[currentAvatarIndex].alt}</p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="improvementAreas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg">Tus Metas y Aspiraciones</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe las áreas de tu vida que deseas mejorar, tus objetivos principales, tus aspiraciones, etc. (Ej: 'Quiero ser más disciplinado con mis estudios, mejorar mi condición física y aprender a ser un líder más efectivo.')"
                      {...field}
                      rows={5}
                      className="text-base"
                    />
                  </FormControl>
                  <FormDescription>Esta información nos ayudará a definir una base para tus habilidades.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!generatedAIData && (
              <Button type="button" onClick={handleGenerateStats} disabled={isGeneratingStats} className="w-full p5-button-accent py-6 text-lg">
                {isGeneratingStats ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <Sparkles className="mr-2 h-6 w-6" />}
                {isGeneratingStats ? "Procesando..." : "Generar Mis Estadísticas"}
              </Button>
            )}

            {aiError && <p className="text-sm text-destructive text-center p-3 bg-destructive/10 rounded-md flex items-center justify-center"><AlertTriangle className="mr-2 h-4 w-4"/> {aiError}</p>}
            
            {generatedAIData && (
              <Card className="mt-6 bg-primary/5 border-primary/30">
                <CardHeader className="p5-panel-header items-center !pb-3">
                  <CardTitle className="text-xl flex items-center"><Dices className="mr-2"/> ¡Tus Estadísticas Iniciales!</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <p className="text-muted-foreground italic text-center">"{generatedAIData.characterPreamble}"</p>
                  <h4 className="font-semibold text-lg text-center pt-2">Tus Estadísticas Base:</h4>
                  <ul className="space-y-2">
                    {generatedAIData.stats.map(stat => (
                      <li key={stat.name} className="p-2 bg-card/50 rounded-md shadow-sm">
                        <strong className="text-accent">{stat.name}:</strong> {stat.description}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-muted-foreground text-center pt-2">Estas 5 estadísticas iniciales servirán como base para tu progreso. Cada una comenzará en Etapa 1, con 0 Puntos.</p>
                </CardContent>
              </Card>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full p5-button-primary py-6 text-xl" disabled={!generatedAIData || isSubmitting || isGeneratingStats}>
              {isSubmitting ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <BookOpen className="mr-2 h-6 w-6" />}
              {isSubmitting ? "Guardando Perfil..." : "Comenzar"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
