
"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Habit, HabitType, HabitFrequency, Difficulty } from "@/types"; // Added Difficulty
import { HABIT_TYPE_OPTIONS, HABIT_FREQUENCY_OPTIONS, DIFFICULTY_OPTIONS } from "@/config/game-config"; // Added DIFFICULTY_OPTIONS
import { useLifeQuest } from "@/hooks/use-life-quest-store";

const NONE_STAT_VALUE = "__NONE__";

const habitFormSchema = z.object({
  title: z.string().min(3, "El título debe tener al menos 3 caracteres.").max(100),
  description: z.string().max(500).optional(),
  type: z.enum(HABIT_TYPE_OPTIONS as [string, ...string[]]),
  frequency: z.enum(HABIT_FREQUENCY_OPTIONS as [string, ...string[]]),
  difficulty: z.enum(DIFFICULTY_OPTIONS as [string, ...string[]]), // New field
  targetStat: z.string().optional(),
  // statImprovementValue is removed
});

type HabitFormValues = z.infer<typeof habitFormSchema>;

interface HabitFormProps {
  habit?: Habit | null;
  onSubmit: (data: Omit<HabitFormValues, 'statImprovementValue'>) => void; // Ensure correct type for onSubmit
  onCancel: () => void;
  submitButtonText?: string;
}

export function HabitForm({ habit, onSubmit, onCancel, submitButtonText = "Guardar Disciplina" }: HabitFormProps) {
  const { player } = useLifeQuest();
  const availableStats = player && player.stats ? Object.keys(player.stats) : [];

  const form = useForm<HabitFormValues>({
    resolver: zodResolver(habitFormSchema),
    defaultValues: {
      title: habit?.title || "",
      description: habit?.description || "",
      type: habit?.type || "Good",
      frequency: (Array.isArray(habit?.frequency) ? "Daily" : habit?.frequency) || "Daily",
      difficulty: habit?.difficulty || "Easy", // Default difficulty
      targetStat: habit?.targetStat || undefined,
    },
  });

  function handleSubmit(data: HabitFormValues) {
    const { ...processedData } = data;
    if (processedData.targetStat === NONE_STAT_VALUE) {
      processedData.targetStat = undefined;
    }
    onSubmit(processedData);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 p-1">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">Título de la Disciplina</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Meditación Matutina" {...field} className="text-base" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Detalles (Opcional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe la disciplina..." {...field} rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {HABIT_TYPE_OPTIONS.map(option => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>Buena para construir, Mala para romper.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="frequency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Frecuencia</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona frecuencia" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {HABIT_FREQUENCY_OPTIONS.map(option => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="difficulty"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dificultad</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona dificultad" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {DIFFICULTY_OPTIONS.map(option => (
                      <SelectItem key={option} value={option as Difficulty}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>Impacta el XP y monedas obtenidas/perdidas.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="targetStat"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Skill Objetivo (Opcional)</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || undefined}
                  disabled={availableStats.length === 0}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={availableStats.length > 0 ? "Selecciona skill" : "No hay skills definidas"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={NONE_STAT_VALUE}>Ninguno</SelectItem>
                    {availableStats.map(statKey => (
                      <SelectItem key={statKey} value={statKey}>{statKey}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>Skill que mejora esta disciplina.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" className="p5-button-primary">
            {submitButtonText}
          </Button>
        </div>
      </form>
    </Form>
  );
}
