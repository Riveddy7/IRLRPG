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
import type { Habit, HabitType, HabitFrequency, PlayerStats } from "@/types";
import { HABIT_TYPE_OPTIONS, HABIT_FREQUENCY_OPTIONS, HABIT_TARGET_STAT_OPTIONS, STAT_NAMES } from "@/config/game-config";

const habitFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters.").max(100),
  description: z.string().max(500).optional(),
  type: z.enum(HABIT_TYPE_OPTIONS as [string, ...string[]]),
  frequency: z.enum(HABIT_FREQUENCY_OPTIONS as [string, ...string[]]), // Simplified for now
  targetStat: z.enum(HABIT_TARGET_STAT_OPTIONS as [keyof PlayerStats, ...(keyof PlayerStats)[]]).optional(),
  statImprovementValue: z.coerce.number().min(0).max(10).default(1),
});

type HabitFormValues = z.infer<typeof habitFormSchema>;

interface HabitFormProps {
  habit?: Habit | null;
  onSubmit: (data: HabitFormValues) => void;
  onCancel: () => void;
  submitButtonText?: string;
}

export function HabitForm({ habit, onSubmit, onCancel, submitButtonText = "Save Discipline" }: HabitFormProps) {
  const form = useForm<HabitFormValues>({
    resolver: zodResolver(habitFormSchema),
    defaultValues: {
      title: habit?.title || "",
      description: habit?.description || "",
      type: habit?.type || "Good",
      frequency: (Array.isArray(habit?.frequency) ? "Daily" : habit?.frequency) || "Daily", // Simplification
      targetStat: habit?.targetStat || undefined,
      statImprovementValue: habit?.statImprovementValue || 1,
    },
  });

  function handleSubmit(data: HabitFormValues) {
    onSubmit(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 p-1">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">Discipline Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Morning Meditation" {...field} className="text-base" />
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
              <FormLabel>Details (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe the habit..." {...field} rows={3} />
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
                <FormLabel>Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {HABIT_TYPE_OPTIONS.map(option => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>Good to build, Bad to break.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="frequency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Frequency</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {HABIT_FREQUENCY_OPTIONS.map(option => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                    {/* Add custom frequency later */}
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
            name="targetStat"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Target Attribute (Optional)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select attribute" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {HABIT_TARGET_STAT_OPTIONS.map(statKey => (
                      <SelectItem key={statKey} value={statKey}>{STAT_NAMES[statKey] || statKey}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>Which attribute this habit improves.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="statImprovementValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Attribute Boost</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g., 1" {...field} />
                </FormControl>
                <FormDescription>Points added to attribute on completion.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" className="p5-button-primary">
            {submitButtonText}
          </Button>
        </div>
      </form>
    </Form>
  );
}
