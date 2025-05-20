
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { Task, TaskPriority, TaskStatus, Difficulty } from "@/types";
import { TASK_PRIORITY_OPTIONS, TASK_STATUS_OPTIONS, DIFFICULTY_OPTIONS } from "@/config/game-config";
import { useLifeQuest } from "@/hooks/use-life-quest-store";

const NONE_STAT_VALUE = "__NONE__";

const taskFormSchema = z.object({
  title: z.string().min(3, "El título debe tener al menos 3 caracteres.").max(100),
  description: z.string().max(500).optional(),
  dueDate: z.date().optional(),
  priority: z.enum(TASK_PRIORITY_OPTIONS as [string, ...string[]]),
  status: z.enum(TASK_STATUS_OPTIONS as [string, ...string[]]).default('To Do'),
  difficulty: z.enum(DIFFICULTY_OPTIONS as [string, ...string[]]), // New field
  targetStat: z.string().optional(), // New field for target skill
  // xpReward field is removed
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

interface TaskFormProps {
  task?: Task | null;
  onSubmit: (data: TaskFormValues) => void;
  onCancel: () => void;
  submitButtonText?: string;
}

export function TaskForm({ task, onSubmit, onCancel, submitButtonText = "Guardar Misión" }: TaskFormProps) {
  const { player } = useLifeQuest();
  const availableStats = player && player.stats ? Object.keys(player.stats) : [];

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: task?.title || "",
      description: task?.description || "",
      dueDate: task?.dueDate ? new Date(task.dueDate) : undefined,
      priority: task?.priority || "Medium",
      status: task?.status || "To Do",
      difficulty: task?.difficulty || "Easy", // Default difficulty
      targetStat: task?.targetStat || undefined,
    },
  });

  function handleSubmit(data: TaskFormValues) {
    const processedData = { ...data };
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
              <FormLabel className="text-base">Título de la Misión</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Infiltrar el Palacio" {...field} className="text-base"/>
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
              <FormLabel>Briefing (Opcional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Detalles sobre la misión..." {...field} rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nivel de Prioridad</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona prioridad" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TASK_PRIORITY_OPTIONS.map(option => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fecha Límite (Opcional)</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Elige una fecha</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date(new Date().setHours(0,0,0,0)) }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
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
                <FormDescription>Impacta el XP y monedas obtenidas.</FormDescription>
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
                <FormDescription>Skill que mejora esta misión.</FormDescription>
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
