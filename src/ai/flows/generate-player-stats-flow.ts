
'use server';
/**
 * @fileOverview Flow para generar stats de jugador basados en sus aspiraciones.
 *
 * - generatePlayerStats - Genera 5 atributos y sus descripciones.
 * - GeneratePlayerStatsInput - Input para el flow.
 * - GeneratePlayerStatsOutput - Output del flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod'; // Import Zod directly

// Define Schemas internally - DO NOT EXPORT THESE CONSTANTS
const StatDetailSchema = z.object({
  name: z.string().describe('Nombre conciso del atributo (1-2 palabras).'),
  description: z.string().describe('Breve descripción del atributo (1 frase).'),
});

const GeneratePlayerStatsInputSchema = z.object({
  aspirations: z
    .string()
    .describe(
      'Las áreas de la vida que el jugador considera importantes y quiere mejorar.'
    ),
});

const GeneratePlayerStatsOutputSchema = z.object({
  characterPreamble: z.string().describe('Una breve descripción del personaje en tono de videojuego, basada en sus aspiraciones y los stats generados.'),
  stats: z.array(StatDetailSchema).length(5).describe('Un array de exactamente 5 atributos generados.'),
});

// Export Types
export type GeneratePlayerStatsInput = z.infer<typeof GeneratePlayerStatsInputSchema>;
export type GeneratePlayerStatsOutput = z.infer<typeof GeneratePlayerStatsOutputSchema>;

// Export Async Function
export async function generatePlayerStats(input: GeneratePlayerStatsInput): Promise<GeneratePlayerStatsOutput> {
  return generatePlayerStatsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePlayerStatsPrompt',
  input: { schema: GeneratePlayerStatsInputSchema }, // Uses internal schema
  output: { schema: GeneratePlayerStatsOutputSchema }, // Uses internal schema
  prompt: `Eres un Oráculo Ancestral en un RPG que ayuda a los nuevos aventureros a descubrir sus talentos innatos.
Basado en las siguientes aspiraciones y áreas de mejora que el jugador ha compartido:
"{{{aspirations}}}"

Por favor, haz lo siguiente:
1. Escribe una breve y evocadora descripción del personaje (2-3 frases) que capture la esencia de sus aspiraciones y los talentos que está a punto de descubrir. Usa un tono de videojuego RPG.
2. Genera EXACTAMENTE 5 atributos (stats) únicos y relevantes para su aventura. Cada atributo debe tener:
    - Un nombre conciso y poderoso (máximo 2 palabras, ej: "Corazón Valiente", "Mente Estratégica", "Alma Persistente").
    - Una breve descripción (1 frase concisa) que explique qué representa ese atributo.

Asegúrate que los nombres de los atributos sean distintos entre sí.
Devuelve la descripción del personaje y los 5 atributos.`,
  config: {
    // temperature: 0.7, 
  }
});

const generatePlayerStatsFlow = ai.defineFlow(
  {
    name: 'generatePlayerStatsFlow',
    inputSchema: GeneratePlayerStatsInputSchema, // Uses internal schema
    outputSchema: GeneratePlayerStatsOutputSchema, // Uses internal schema
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
        throw new Error("La IA no pudo generar los atributos del jugador.");
    }
    // Asegurarse de que tengamos 5 stats, aunque el esquema de Zod ya lo valida.
    if (output.stats.length !== 5) {
        console.warn("La IA no generó exactamente 5 stats, se recibieron:", output.stats.length);
        // Aquí podrías tener una lógica de reintento o fallback si es necesario.
        // Por ahora, lanzaremos un error si no se cumplen las expectativas.
        throw new Error("La IA no generó el número esperado de atributos (se esperaban 5).");
    }
    return output;
  }
);
