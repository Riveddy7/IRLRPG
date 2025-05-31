
'use server';
/**
 * @fileOverview Flow para sugerir disciplinas basadas en un atributo del jugador.
 *
 * - suggestDisciplinesForSkill - Sugiere 2 disciplinas (una fácil, una difícil).
 * - SuggestDisciplinesInput - Input para el flow.
 * - SuggestDisciplinesOutput - Output del flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast'; // Import for internal toast if needed, but typically UI calls toast.

const SuggestedDisciplineSchema = z.object({
  title: z.string().describe('Nombre conciso y práctico para la nueva disciplina (máx 5 palabras, ej: "Hacer 15 min de cardio", "Leer 1 capítulo").'),
  description: z.string().describe('Descripción breve y motivadora de la disciplina, enfocada en la acción (1-2 frases concisas, ej: "Activa tu cuerpo y mejora tu resistencia.", "Expande tu conocimiento y vocabulario.").'),
  difficulty: z.enum(['Easy', 'Hard']).describe('La dificultad asignada a esta disciplina ("Easy" o "Hard").'),
});

const SuggestDisciplinesInputSchema = z.object({
  skillName: z.string().describe('El nombre del atributo para el cual mejorar (ej: "Bienestar Físico", "Mente Ágil", "Comunicación Asertiva").'),
  skillDescription: z.string().describe('La descripción del atributo, para dar contexto (ej: "Capacidad de mantener un cuerpo sano y en forma.", "Agilidad mental para resolver problemas y aprender.", "Habilidad para expresar ideas y conectar con otros.").'),
  existingDisciplineTitles: z.array(z.string()).describe('Un array de títulos de disciplinas que el jugador ya tiene, para evitar sugerencias repetitivas.'),
});

const SuggestDisciplinesOutputSchema = z.object({
  suggestions: z.array(SuggestedDisciplineSchema).length(2).describe('Un array de exactamente 2 disciplinas sugeridas, una "Easy" y una "Hard".'),
});

export type SuggestDisciplinesInput = z.infer<typeof SuggestDisciplinesInputSchema>;
export type SuggestDisciplinesOutput = z.infer<typeof SuggestDisciplinesOutputSchema>;

export async function suggestDisciplinesForSkill(input: SuggestDisciplinesInput): Promise<SuggestDisciplinesOutput> {
  return suggestDisciplinesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestDisciplinesPrompt',
  input: { schema: SuggestDisciplinesInputSchema },
  output: { schema: SuggestDisciplinesOutputSchema },
  prompt: `Eres un experto en desarrollo personal y coach de hábitos, enfocado en ayudar a las personas a mejorar atributos concretos en su día a día.
El usuario quiere mejorar su atributo llamado "{{skillName}}", el cual se describe como: "{{skillDescription}}".

El usuario ya tiene las siguientes disciplinas: {{#if existingDisciplineTitles}} "{{#each existingDisciplineTitles}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}" {{else}} (ninguna) {{/if}}. Evita sugerir disciplinas con nombres o propósitos muy similares a estas.

Por favor, sugiere EXACTAMENTE DOS nuevas disciplinas DIARIAS para este usuario. Las disciplinas deben ser **acciones prácticas, concretas y aplicables a la vida real**.
1.  Una disciplina de dificultad "Easy".
2.  Una disciplina de dificultad "Hard".

Para cada disciplina, proporciona:
-   Un 'title': Nombre conciso y práctico (máx 5 palabras). Ejemplos: si el atributo es "Bienestar Físico", un título fácil podría ser "Estirar 10 min" y uno difícil "Entrenamiento de fuerza 30 min". Si el atributo es "Comunicación Asertiva", un título fácil podría ser "Escuchar activamente a alguien" y uno difícil "Practicar dar feedback constructivo".
-   Una 'description': Breve (1-2 frases concisas), enfocada en la acción y el beneficio real.
-   La 'difficulty': "Easy" o "Hard" según corresponda.

Asegúrate que las dos sugerencias sean distintas entre sí y realmente ayuden a desarrollar el atributo "{{skillName}}" de forma tangible en la vida diaria del usuario.
La primera sugerencia en el array debe ser la "Easy" y la segunda la "Hard". Sé directo y práctico.`,
  config: {
    temperature: 0.6, 
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
    
    const difficulties = output.suggestions.map(s => s.difficulty);
    if (!(difficulties.includes('Easy') && difficulties.includes('Hard'))) {
        console.warn("La IA no generó una disciplina Easy y una Hard. Se recibió:", difficulties, "Sugerencias:", output.suggestions);
        // Attempt to fix if one is missing and the other is duplicated, or default if structure is wrong
        if (output.suggestions[0].difficulty === output.suggestions[1].difficulty) {
            output.suggestions[1].difficulty = output.suggestions[0].difficulty === 'Easy' ? 'Hard' : 'Easy';
            // Consider if a toast here is appropriate or if the calling UI should handle adjustments.
            // For now, just logging the auto-correction.
            console.log("Ajuste IA: Se ajustó la dificultad de una sugerencia.");
        } else if (!difficulties.includes('Easy')) {
             const hardSuggestion = output.suggestions.find(s => s.difficulty === 'Hard');
             const otherSuggestion = output.suggestions.find(s => s.difficulty !== 'Hard');
             if (otherSuggestion) otherSuggestion.difficulty = 'Easy';
             else throw new Error("Error en la estructura de sugerencias de IA, no se pudo corregir.");
        } else if (!difficulties.includes('Hard')) {
             const easySuggestion = output.suggestions.find(s => s.difficulty === 'Easy');
             const otherSuggestion = output.suggestions.find(s => s.difficulty !== 'Easy');
             if (otherSuggestion) otherSuggestion.difficulty = 'Hard';
             else throw new Error("Error en la estructura de sugerencias de IA, no se pudo corregir.");
        } else {
            throw new Error("La IA no generó una disciplina Easy y una Hard con el formato esperado.");
        }
    }
     // Ensure order: Easy first, Hard second
    output.suggestions.sort((a, b) => {
      if (a.difficulty === 'Easy' && b.difficulty === 'Hard') return -1;
      if (a.difficulty === 'Hard' && b.difficulty === 'Easy') return 1;
      return 0;
    });

    return output;
  }
);
