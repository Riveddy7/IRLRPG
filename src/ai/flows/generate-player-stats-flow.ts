
'use server';
/**
 * @fileOverview Flow para generar atributos de jugador basados en sus aspiraciones de desarrollo personal.
 *
 * - generatePlayerStats - Genera 5 atributos y sus descripciones.
 * - GeneratePlayerStatsInput - Input para el flow.
 * - GeneratePlayerStatsOutput - Output del flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod'; 

const StatDetailSchema = z.object({
  name: z.string().describe('Nombre conciso y significativo del atributo (1-3 palabras, ej: "Enfoque Determinado", "Comunicación Efectiva").'),
  description: z.string().describe('Breve descripción del atributo y su relevancia para el desarrollo personal (1-2 frases concisas).'),
});

const GeneratePlayerStatsInputSchema = z.object({
  aspirations: z
    .string()
    .describe(
      'Las áreas de la vida que el usuario considera importantes y quiere mejorar, sus metas y sueños.'
    ),
});

const GeneratePlayerStatsOutputSchema = z.object({
  characterPreamble: z.string().describe('Una breve introducción motivacional (2-3 frases) basada en las aspiraciones del usuario y los atributos generados, enfocada en cómo estos pueden apoyar su desarrollo.'),
  stats: z.array(StatDetailSchema).length(5).describe('Un array de exactamente 5 atributos personales generados.'),
});

export type GeneratePlayerStatsInput = z.infer<typeof GeneratePlayerStatsInputSchema>;
export type GeneratePlayerStatsOutput = z.infer<typeof GeneratePlayerStatsOutputSchema>;

export async function generatePlayerStats(input: GeneratePlayerStatsInput): Promise<GeneratePlayerStatsOutput> {
  return generatePlayerStatsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePlayerStatsPrompt',
  input: { schema: GeneratePlayerStatsInputSchema }, 
  output: { schema: GeneratePlayerStatsOutputSchema }, 
  prompt: `Eres un asistente IA especializado en desarrollo personal. Tu objetivo es ayudar a las personas a definir atributos clave basados en sus aspiraciones.
Basado en las siguientes aspiraciones y áreas de mejora que el usuario ha compartido:
"{{{aspirations}}}"

Por favor, haz lo siguiente:
1. Escribe una breve introducción (2-3 frases concisas) que resuma las aspiraciones del usuario y cómo los atributos generados pueden apoyarle en su camino de desarrollo. Usa un tono motivador y práctico.
2. Genera EXACTAMENTE 5 atributos personales únicos y relevantes para su desarrollo. Cada atributo debe tener:
    - Un nombre conciso y significativo (máximo 3 palabras, ej: "Enfoque Determinado", "Comunicación Efectiva", "Resiliencia Emocional", "Creatividad Aplicada", "Bienestar Físico").
    - Una breve descripción (1-2 frases concisas) que explique qué representa ese atributo en el contexto del desarrollo personal y cómo puede cultivarse.

Asegúrate que los nombres de los atributos sean distintos entre sí y enfocados en habilidades o cualidades tangibles para la vida real.
Devuelve la introducción y los 5 atributos.`,
  config: {
    temperature: 0.7, 
  }
});

const generatePlayerStatsFlow = ai.defineFlow(
  {
    name: 'generatePlayerStatsFlow',
    inputSchema: GeneratePlayerStatsInputSchema, 
    outputSchema: GeneratePlayerStatsOutputSchema, 
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
        throw new Error("La IA no pudo generar los atributos del perfil.");
    }
    if (output.stats.length !== 5) {
        console.warn("La IA no generó exactamente 5 atributos, se recibieron:", output.stats.length);
        throw new Error("La IA no generó el número esperado de atributos (se esperaban 5).");
    }
    return output;
  }
);
