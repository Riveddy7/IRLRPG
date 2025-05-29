
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
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { Discipline } from '@/types/firestore-schemas'; // Using 'type' import

// Define Schemas internamente - DO NOT EXPORT THESE CONSTANTS
const SuggestedDisciplineSchema = z.object({
  title: z.string().describe('Nombre conciso y práctico para la nueva disciplina (máx 5 palabras, ej: "Hacer 15 min de cardio", "Leer 1 capítulo").'),
  description: z.string().describe('Descripción breve y motivadora de la disciplina, enfocada en la acción (1-2 frases concisas, ej: "Activa tu cuerpo y mejora tu resistencia.", "Expande tu conocimiento y vocabulario.").'),
  difficulty: z.enum(['Easy', 'Hard']).describe('La dificultad asignada a esta disciplina ("Easy" o "Hard").'),
});

const SuggestDisciplinesInputSchema = z.object({
  skillName: z.string().describe('El nombre de la skill para la cual mejorar (ej: "Cuerpo Templado", "Mente Ágil", "Carisma Social").'),
  skillDescription: z.string().describe('La descripción de la skill, para dar contexto (ej: "Capacidad de resistir y superar desafíos físicos.", "Agilidad mental para resolver problemas y aprender.", "Habilidad para conectar e influir positivamente en otros.").'),
  existingDisciplineTitles: z.array(z.string()).describe('Un array de títulos de disciplinas que el jugador ya tiene, para evitar sugerencias repetitivas.'),
  generalSkillId: z.string().describe('The ID of the general skill this discipline belongs to.'),
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
  prompt: `Eres un experto en desarrollo personal y coach de vida, enfocado en ayudar a las personas a mejorar habilidades concretas en su día a día.
El usuario quiere mejorar su skill llamada "{{skillName}}", la cual se describe como: "{{skillDescription}}".

El jugador ya tiene las siguientes disciplinas: {{#if existingDisciplineTitles}} "{{#each existingDisciplineTitles}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}" {{else}} (ninguna) {{/if}}. Evita sugerir disciplinas con nombres o propósitos muy similares a estas.

Por favor, sugiere EXACTAMENTE DOS nuevas disciplinas DIARIAS para este jugador. Las disciplinas deben ser **acciones prácticas, concretas y aplicables a la vida real**, no fantasiosas.
1.  Una disciplina de dificultad "Easy".
2.  Una disciplina de dificultad "Hard".

Para cada disciplina, proporciona:
-   Un 'title': Nombre conciso y práctico (máx 5 palabras). Ejemplos: si la skill es "Cuerpo Templado", un título fácil podría ser "Estirar 10 min" y uno difícil "Entrenamiento de fuerza 30 min". Si la skill es "Carisma Social", un título fácil podría ser "Sonreír a un extraño" y uno difícil "Iniciar conversación con alguien nuevo".
-   Una 'description': Breve (1-2 frases concisas), enfocada en la acción y el beneficio real.
-   La 'difficulty': "Easy" o "Hard" según corresponda.

Asegúrate que las dos sugerencias sean distintas entre sí y realmente ayuden a desarrollar la skill "{{skillName}}" de forma tangible en la vida diaria del usuario.
La primera sugerencia en el array debe ser la "Easy" y la segunda la "Hard". No uses lenguaje de RPG o fantasía. Sé directo y práctico.`,
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
    
    // Validate and adjust difficulties as before
    const difficulties = output.suggestions.map(s => s.difficulty);
    if (!(difficulties.includes('Easy') && difficulties.includes('Hard'))) {
        console.warn("La IA no generó una disciplina Easy y una Hard. Se recibió:", difficulties, "Sugerencias:", output.suggestions);
        if (output.suggestions[0].difficulty === output.suggestions[1].difficulty) {
            output.suggestions[1].difficulty = output.suggestions[0].difficulty === 'Easy' ? 'Hard' : 'Easy';
            // Consider if toast is available/appropriate in this server-side flow context
            // toast({title: "Ajuste IA", description: "Se ajustó la dificultad de una sugerencia.", variant:"default"});
            console.log("Ajuste IA: Se ajustó la dificultad de una sugerencia.");
        } else if (!difficulties.includes('Easy')) {
             const easySuggestion = output.suggestions.find(s => s.difficulty !== 'Hard');
             if(easySuggestion) easySuggestion.difficulty = 'Easy';
        } else if (!difficulties.includes('Hard')) {
             const hardSuggestion = output.suggestions.find(s => s.difficulty !== 'Easy');
             if(hardSuggestion) hardSuggestion.difficulty = 'Hard';
        } else {
            // This case should ideally not be reached if the above logic is sound
            console.error("Error no manejado en ajuste de dificultad de IA.");
            // throw new Error("La IA no generó una disciplina Easy y una Hard con el formato esperado después de los ajustes.");
        }
    }
    
    // Ensure order: Easy first, Hard second
    output.suggestions.sort((a, b) => {
      if (a.difficulty === 'Easy' && b.difficulty === 'Hard') return -1;
      if (a.difficulty === 'Hard' && b.difficulty === 'Easy') return 1;
      return 0;
    });

    // Persist AI-generated suggestions to Firestore
    for (const suggestion of output.suggestions) {
      const newDiscipline: Omit<Discipline, 'id'> = { // Let Firestore generate ID
        name: suggestion.title,
        description: suggestion.description,
        difficulty: suggestion.difficulty as 'Easy' | 'Hard', // Already validated
        generalSkillId: input.generalSkillId,
        isAIGenerated: true,
        selectionCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        // No `id` field here, Firestore will generate it.
      };
      try {
        const docRef = await addDoc(collection(db, 'disciplines'), newDiscipline);
        console.log(`AI-generated discipline "${suggestion.title}" saved with ID: ${docRef.id}`);
        // Optionally, we could add the generated ID back to the suggestion object if needed by the client,
        // but the current task is to return the original AI output structure.
      } catch (error) {
        console.error(`Error saving AI-generated discipline "${suggestion.title}" to Firestore:`, error);
        // Do not block returning suggestions to the user.
        // Consider more robust error reporting if this becomes a frequent issue.
      }
    }

    return output;
  }
);
