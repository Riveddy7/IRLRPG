
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
  nickname: z.string().min(3, "Tu nombre de usuario debe tener al menos 3 letras.").max(50, "Nombre demasiado largo."),
  age: z.coerce.number().min(1, "Debes indicar tu edad.").max(150, "Edad un poco... ¿extrema?"),
  genderAvatarKey: z.string().min(1, "Debes elegir un avatar."),
  improvementAreas: z.string().min(20, "¡Cuéntanos más! Al menos 20 caracteres.").max(1000, "Sé concreto y al grano, por favor."),
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
      nickname: player?.name && player.name !== "Novato" ? player.name : "",
      age: player?.age || undefined,
      genderAvatarKey: player?.genderAvatarKey || avatarOptions[0].key, 
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
      console.error("Error generando atributos con IA:", error);
      let message = "La IA está meditando o hubo un error al procesar tu petición. Intenta de nuevo en un momento.";
      if (error.message?.includes("La IA no pudo generar los atributos según el formato esperado.")) {
        message = "La IA no pudo generar los atributos según el formato esperado. Revisa la consola para más detalles.";
      } else if (error.message) {
        message = error.message;
      }
      if (error.cause) console.error("Causa del error:", error.cause);
      setAiError(message);
    } finally {
      setIsGeneratingStats(false);
    }
  };

  async function onSubmit(data: QuizFormValues) {
    if (!generatedAIData) {
      setAiError("Primero debes generar tus atributos con la ayuda de la IA.");
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
      characterPreamble: generatedAIData.characterPreamble,
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
        <p className="mt-4 text-lg text-muted-foreground">Consultando datos...</p>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto bg-card/80 backdrop-blur-sm shadow-2xl border-primary/50">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl p5-text-shadow flex items-center justify-center"><UserCheck className="mr-3 h-8 w-8" /> Define tu Perfil</CardTitle>
        <CardDescription>El primer paso en tu desarrollo personal. Define quién eres y qué aspiras a ser.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="nickname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg">Nombre de Usuario</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: 'El Estratega'" {...field} className="text-base" />
                  </FormControl>
                  <FormDescription>Así te identificarás en la aplicación.</FormDescription>
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
              render={({ field }) => ( 
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
                            key={avatarOptions[currentAvatarIndex].key} 
                            src={avatarOptions[currentAvatarIndex].fullBodySrc}
                            alt={avatarOptions[currentAvatarIndex].alt}
                            width={270} 
                            height={480} 
                            className="object-contain h-full w-auto animate-idle-bob" 
                            data-ai-hint={avatarOptions[currentAvatarIndex].fullBodyDataAiHint}
                            priority 
                          />
                        )}
                      </div>
                      
                      <Button type="button" variant="outline" size="icon" onClick={handleNextAvatar} aria-label="Siguiente avatar">
                        <ChevronRight className="h-6 w-6" />
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="improvementAreas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg">Describe tus Aspiraciones</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ej: Mejorar mi condición física haciendo ejercicio 3 veces por semana y comiendo más sano; avanzar en mi carrera aprendiendo una nueva habilidad; dedicar más tiempo a mis pasatiempos como la pintura o la música."
                      {...field}
                      rows={5}
                      className="text-base"
                    />
                  </FormControl>
                  <FormDescription>Describe tus principales metas y las áreas de tu vida que quieres mejorar. Basado en esto, la IA generará 5 atributos personalizados para tu desarrollo.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!generatedAIData && (
              <Button type="button" onClick={handleGenerateStats} disabled={isGeneratingStats} className="w-full p5-button-accent py-6 text-lg">
                {isGeneratingStats ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <Sparkles className="mr-2 h-6 w-6" />}
                {isGeneratingStats ? "IA generando atributos..." : "Generar Atributos con IA"}
              </Button>
            )}

            {aiError && <p className="text-sm text-destructive text-center p-3 bg-destructive/10 rounded-md flex items-center justify-center"><AlertTriangle className="mr-2 h-4 w-4"/> {aiError}</p>}
            
            {generatedAIData && (
              <Card className="mt-6 bg-primary/5 border-primary/30">
                <CardHeader className="p5-panel-header items-center !pb-3">
                  <CardTitle className="text-xl flex items-center"><Dices className="mr-2"/> ¡Atributos Generados!</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <p className="text-muted-foreground italic text-center">"{generatedAIData.characterPreamble}"</p>
                  <h4 className="font-semibold text-lg text-center pt-2">Tus Atributos Clave:</h4>
                  <ul className="space-y-2">
                    {generatedAIData.stats.map(stat => (
                      <li key={stat.name} className="p-2 bg-card/50 rounded-md shadow-sm">
                        <strong className="text-accent">{stat.name}:</strong> {stat.description}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-muted-foreground text-center pt-2">Estos 5 atributos formarán el núcleo de tu desarrollo. Cada uno comenzará en Nivel 1, XP 0.</p>
                </CardContent>
              </Card>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full p5-button-primary py-6 text-xl" disabled={!generatedAIData || isSubmitting || isGeneratingStats}>
              {isSubmitting ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <BookOpen className="mr-2 h-6 w-6" />}
              {isSubmitting ? "Guardando Perfil..." : "¡Comenzar Aventura!"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
