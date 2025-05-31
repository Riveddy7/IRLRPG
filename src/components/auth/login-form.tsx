
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import Link from "next/link";

const loginFormSchema = z.object({
  email: z.string().email("Dirección de email inválida.").min(1, "El email es requerido."),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres.").min(1, "La contraseña es requerida."),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export function LoginForm() {
  const { loginUser, isLoading, error } = useAuth();
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginFormValues) {
    await loginUser(data.email, data.password);
  }

  return (
    <Card className="w-full bg-card/80 backdrop-blur-sm shadow-2xl border-primary/50">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl p5-text-shadow">¡Bienvenido de Nuevo!</CardTitle>
        <CardDescription>Ingresa tus credenciales para continuar tu progreso.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="tu@ejemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            <Button type="submit" className="w-full p5-button-primary" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Iniciar Sesión
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col items-center space-y-2">
        <p className="text-sm text-muted-foreground">
          ¿Nuevo por aquí?{" "}
          <Button variant="link" className="p-0 h-auto text-accent hover:text-accent/80" asChild>
            <Link href="/register">Regístrate aquí</Link>
          </Button>
        </p>
      </CardFooter>
    </Card>
  );
}
