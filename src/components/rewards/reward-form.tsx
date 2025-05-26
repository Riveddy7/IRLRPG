
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
import type { RewardItem } from "@/types";
import { Coins } from "lucide-react";

const rewardFormSchema = z.object({
  title: z.string().min(3, "El título debe tener al menos 3 caracteres.").max(100),
  description: z.string().max(500).optional(),
  cost: z.coerce.number().min(0, "El costo no puede ser negativo.").int("El costo debe ser un número entero."),
});

type RewardFormValues = z.infer<typeof rewardFormSchema>;

interface RewardFormProps {
  reward?: RewardItem | null;
  onSubmit: (data: RewardFormValues) => void;
  onCancel: () => void;
  submitButtonText?: string;
}

export function RewardForm({ reward, onSubmit, onCancel, submitButtonText = "Guardar Recompensa" }: RewardFormProps) {
  const form = useForm<RewardFormValues>({
    resolver: zodResolver(rewardFormSchema),
    defaultValues: {
      title: reward?.title || "",
      description: reward?.description || "",
      cost: reward?.cost || 0,
    },
  });

  function handleSubmit(data: RewardFormValues) {
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
              <FormLabel className="text-base">Título de la Recompensa</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Café especial de la mañana" {...field} className="text-base" />
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
              <FormLabel>Descripción (Opcional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Pequeños detalles sobre esta recompensa..." {...field} rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="cost"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center">
                <Coins className="mr-2 h-4 w-4 text-amber-500" /> Costo en Monedas
              </FormLabel>
              <FormControl>
                <Input type="number" placeholder="Ej: 50" {...field} className="text-base" />
              </FormControl>
              <FormDescription>¿Cuántas monedas costará canjear esto?</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

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
