
'use server';
/**
 * @fileOverview Flow para sugerir disciplinas basadas en una skill del jugador.
 *
 * - suggestDisciplinesForSkill - Sugiere 2 disciplinas (una fácil, una difícil).
 * - SuggestDisciplinesInput - Input para el flow.
 * - SuggestDisciplinesOutput - Output del flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Define Schemas internamente - DO NOT EXPORT THESE CONSTANTS
const SuggestedDisciplineSchema = z.object({
  title: z.string().describe('Nombre conciso y atractivo para la nueva disciplina (máx 5 palabras).'),
  description: z.string().describe('Descripción breve y motivadora de la disciplina (1-2 frases concisas).'),
  difficulty: z.enum(['Easy', 'Hard']).describe('La dificultad asignada a esta disciplina ("Easy" o "Hard").'),
});

const SuggestDisciplinesInputSchema = z.object({
  skillName: z.string().describe('El nombre de la skill para la cual mejorar.'),
  skillDescription: z.string().describe('La descripción de la skill, para dar contexto.'),
  existingDisciplineTitles: z.array(z.string()).describe('Un array de títulos de disciplinas que el jugador ya tiene, para evitar sugerencias repetitivas.'),
});

const SuggestDisciplinesOutputSchema = z.object({
  suggestions: z.array(SuggestedDisciplineSchema).length(2).describe('Un array de exactamente 2 disciplinas sugeridas, una "Easy" y una "Hard".'),
});

// Export Types
export type SuggestDisciplinesInput = z.infer<typeof SuggestDisciplinesInputSchema>;
export type SuggestDisciplinesOutput = z.infer<typeof SuggestDisciplinesOutputSchema>;

// Export Async Function
export async function suggestDisciplinesForSkill(input: SuggestDisciplinesInput): Promise<SuggestDisciplinesOutput> {
  return suggestDisciplinesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestDisciplinesPrompt',
  input: { schema: SuggestDisciplinesInputSchema },
  output: { schema: SuggestDisciplinesOutputSchema },
  prompt: `Eres un Sabio Mentor de RPG que ayuda a los aventureros a forjar nuevas disciplinas para potenciar sus habilidades.
El jugador quiere mejorar su skill llamada "{{skillName}}", la cual se describe como: "{{skillDescription}}".

El jugador ya tiene las siguientes disciplinas: {{#if existingDisciplineTitles}} "{{#each existingDisciplineTitles}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}" {{else}} (ninguna) {{/if}}. Evita sugerir disciplinas con nombres muy similares a estas.

Por favor, sugiere EXACTAMENTE DOS nuevas disciplinas DIARIAS para este jugador:
1.  Una disciplina de dificultad "Easy".
2.  Una disciplina de dificultad "Hard".

Para cada disciplina, proporciona:
-   Un 'title' (nombre conciso y atractivo, máximo 5 palabras).
-   Una 'description' (breve y motivadora, 1-2 frases concisas).
-   La 'difficulty' ("Easy" o "Hard" según corresponda).

Asegúrate que las dos sugerencias sean distintas entre sí y realmente ayuden a desarrollar la skill "{{skillName}}".
La primera sugerencia en el array debe ser la "Easy" y la segunda la "Hard".`,
  config: {
    temperature: 0.6, // Un poco de creatividad pero manteniendo la estructura.
  }
});

const suggestDisciplinesFlow = ai.defineFlow(
  {
    name: 'suggestDisciplinesFlow',
    inputSchema: SuggestDisciplinesInputSchema,
    outputSchema: SuggestDisciplinesOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output || output.suggestions.length !== 2) {
        throw new Error("La IA no pudo generar las dos sugerencias de disciplinas esperadas o el formato es incorrecto.");
    }
    // Opcional: asegurar que haya una Easy y una Hard si el prompt no lo garantiza
    const difficulties = output.suggestions.map(s => s.difficulty);
    if (!difficulties.includes('Easy') || !difficulties.includes('Hard')) {
        console.warn("La IA no generó una disciplina Easy y una Hard. Se recibió:", difficulties);
        // Podrías intentar reordenar o lanzar un error más específico
        // Por ahora, confiamos en el prompt.
    }
    return output;
  }
);
