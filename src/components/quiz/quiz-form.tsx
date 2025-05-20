
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, AlertTriangle, UserCheck, BookOpen, Dices } from "lucide-react";
import { useLifeQuest } from '@/hooks/use-life-quest-store';
import { useRouter } from 'next/navigation';
import { generatePlayerStats, type GeneratePlayerStatsInput, type GeneratePlayerStatsOutput } from '@/ai/flows/generate-player-stats-flow';
import type { Player, PlayerStats as PlayerStatsType } from '@/types';

const avatarOptions = [
  { key: 'avatar1', src: 'https://placehold.co/128x128.png?text=A1', alt: 'Avatar Option 1', dataAiHint: 'cool character' },
  { key: 'avatar2', src: 'https://placehold.co/128x128.png?text=A2', alt: 'Avatar Option 2', dataAiHint: 'fantasy hero' },
];

const quizFormSchema = z.object({
  nickname: z.string().min(3, "Tu nombre de héroe debe tener al menos 3 letras.").max(50, "Nombre demasiado largo."),
  age: z.coerce.number().min(1, "Debes indicar tu edad.").max(150, "Edad un poco... ¿extrema?"),
  genderAvatarKey: z.string().min(1, "Debes elegir un avatar."),
  improvementAreas: z.string().min(20, "¡Cuéntanos más! Unas 20 letras al menos.").max(1000, "Concreto y al grano, por favor."),
});

type QuizFormValues = z.infer<typeof quizFormSchema>;

export function QuizForm() {
  const { updatePlayerProfileAfterQuiz, player } = useLifeQuest();
  const router = useRouter();
  const [isGeneratingStats, setIsGeneratingStats] = useState(false);
  const [generatedAIData, setGeneratedAIData] = useState<GeneratePlayerStatsOutput | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<QuizFormValues>({
    resolver: zodResolver(quizFormSchema),
    defaultValues: {
      nickname: player?.name && player.name !== "Novato" ? player.name : "",
      age: player?.age || undefined,
      genderAvatarKey: player?.genderAvatarKey || "",
      improvementAreas: player?.improvementAreas || "",
    },
  });
  
  useEffect(() => {
    if (player?.hasCompletedQuiz) {
      router.replace('/dashboard');
    }
  }, [player, router]);


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
      console.error("Error generando stats:", error);
      setAiError(error.message || "El Oráculo está meditando... Intenta de nuevo en un momento.");
    } finally {
      setIsGeneratingStats(false);
    }
  };

  async function onSubmit(data: QuizFormValues) {
    if (!generatedAIData) {
      setAiError("Primero debes generar tus atributos con la ayuda del Oráculo.");
      return;
    }
    setIsSubmitting(true);

    const newRawStats: { [key: string]: number } = {}; // Temporarily hold as { statName: 5 }
    const newStatDescriptions: { [key: string]: string } = {};
    
    generatedAIData.stats.forEach(stat => {
      newRawStats[stat.name] = 5; // This will be converted to { xp: 0, level: 5 } in useLifeQuestStore
      newStatDescriptions[stat.name] = stat.description;
    });

    const selectedAvatar = avatarOptions.find(opt => opt.key === data.genderAvatarKey);

    const profileUpdate: Partial<Player> = {
      name: data.nickname,
      age: data.age,
      genderAvatarKey: data.genderAvatarKey,
      avatarUrl: selectedAvatar?.src || 'https://placehold.co/128x128.png',
      dataAiHint: selectedAvatar?.dataAiHint || 'avatar',
      improvementAreas: data.improvementAreas,
      stats: newRawStats as any, // Pass as { statName: 5 }, store will convert to { xp, level }
      statDescriptions: newStatDescriptions,
      // hasCompletedQuiz will be set to true by updatePlayerProfileAfterQuiz
      // coins will be initialized to 0 by updatePlayerProfileAfterQuiz
    };
    
    await updatePlayerProfileAfterQuiz(profileUpdate);
    setIsSubmitting(false);
    router.push('/dashboard'); 
  }

  if (player === undefined) { 
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Consultando los anales...</p>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto bg-card/80 backdrop-blur-sm shadow-2xl border-primary/50">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl p5-text-shadow flex items-center justify-center"><UserCheck className="mr-3 h-8 w-8" /> Forja tu Leyenda</CardTitle>
        <CardDescription>El primer paso en tu gran aventura. Define quién eres y qué aspiras a ser.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="nickname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg">Nombre de Héroe</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: 'El Intrépido'" {...field} className="text-base" />
                  </FormControl>
                  <FormDescription>Así te conocerán en estas tierras.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="age"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg">Edad de Aventurero</FormLabel>
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
                  <FormLabel className="text-lg">Elige tu Estandarte (Avatar)</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col sm:flex-row gap-4 pt-2"
                    >
                      {avatarOptions.map(option => (
                        <FormItem key={option.key} className="flex-1">
                          <FormControl>
                             <RadioGroupItem value={option.key} id={option.key} className="sr-only" />
                          </FormControl>
                          <Label
                            htmlFor={option.key}
                            className={`flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-all
                            ${field.value === option.key ? "border-primary ring-2 ring-primary" : ""}`}
                          >
                            <Image src={option.src} alt={option.alt} width={80} height={80} className="mb-2 rounded-md shadow-md" data-ai-hint={option.dataAiHint}/>
                            <span className="text-sm font-medium">{option.alt}</span>
                          </Label>
                        </FormItem>
                      ))}
                    </RadioGroup>
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
                  <FormLabel className="text-lg">Tu Manifiesto Interior</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe las áreas de tu vida que anhelas transformar, tus metas, tus sueños más profundos... (Ej: 'Quiero ser más disciplinado con mis estudios, mejorar mi condición física y aprender a ser un líder más efectivo.')"
                      {...field}
                      rows={5}
                      className="text-base"
                    />
                  </FormControl>
                  <FormDescription>El Oráculo usará estas palabras para revelar tus talentos innatos.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!generatedAIData && (
              <Button type="button" onClick={handleGenerateStats} disabled={isGeneratingStats} className="w-full p5-button-accent py-6 text-lg">
                {isGeneratingStats ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <Sparkles className="mr-2 h-6 w-6" />}
                {isGeneratingStats ? "El Oráculo está deliberando..." : "Consultar al Oráculo (Generar Atributos)"}
              </Button>
            )}

            {aiError && <p className="text-sm text-destructive text-center p-3 bg-destructive/10 rounded-md flex items-center justify-center"><AlertTriangle className="mr-2 h-4 w-4"/> {aiError}</p>}
            
            {generatedAIData && (
              <Card className="mt-6 bg-primary/5 border-primary/30">
                <CardHeader className="p5-panel-header items-center !pb-3">
                  <CardTitle className="text-xl flex items-center"><Dices className="mr-2"/> ¡Tu Destino se Manifiesta!</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <p className="text-muted-foreground italic text-center">"{generatedAIData.characterPreamble}"</p>
                  <h4 className="font-semibold text-lg text-center pt-2">Tus Atributos Primordiales:</h4>
                  <ul className="space-y-2">
                    {generatedAIData.stats.map(stat => (
                      <li key={stat.name} className="p-2 bg-card/50 rounded-md shadow-sm">
                        <strong className="text-accent">{stat.name}:</strong> {stat.description}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-muted-foreground text-center pt-2">Estos 5 atributos formarán el núcleo de tu ser. Cada uno comenzará en Nivel 5, XP 0.</p>
                </CardContent>
              </Card>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full p5-button-primary py-6 text-xl" disabled={!generatedAIData || isSubmitting || isGeneratingStats}>
              {isSubmitting ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <BookOpen className="mr-2 h-6 w-6" />}
              {isSubmitting ? "Forjando tu Destino..." : "¡Empezar Aventura!"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
