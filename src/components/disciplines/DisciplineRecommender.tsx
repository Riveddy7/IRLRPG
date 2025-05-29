"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Discipline, GeneralSkill } from '@/types/firestore-schemas';
import { db } from '@/lib/firebase';
import { suggestDisciplinesForSkill } from '@/ai/flows/suggest-disciplines-flow';
import { collection, query, where, orderBy, limit, getDocs, doc, getDoc, updateDoc, increment, DocumentSnapshot, QueryDocumentSnapshot } from 'firebase/firestore';
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, RefreshCw } from "lucide-react";

interface DisciplineRecommenderProps {
  generalSkillId: string;
  // Potentially add playerName or other relevant props later
}

const DisciplineRecommender: React.FC<DisciplineRecommenderProps> = ({ generalSkillId }) => {
  const [recommendationAttemptCount, setRecommendationAttemptCount] = useState(0);
  const [recommendations, setRecommendations] = useState<Discipline[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentGeneralSkill, setCurrentGeneralSkill] = useState<GeneralSkill | null>(null);
  const [lastVisibleDoc, setLastVisibleDoc] = useState<QueryDocumentSnapshot | null>(null);

  const fetchMostUsed = useCallback(async (): Promise<Discipline[]> => {
    if (!generalSkillId) return [];
    console.log("Attempting to fetch most used disciplines for:", generalSkillId);
    const disciplinesRef = collection(db, "disciplines");
    const q = query(
      disciplinesRef,
      where("generalSkillId", "==", generalSkillId),
      orderBy("selectionCount", "desc"),
      limit(3)
    );
    const querySnapshot = await getDocs(q);
    const fetchedDisciplines: Discipline[] = [];
    querySnapshot.forEach((doc) => {
      fetchedDisciplines.push({ id: doc.id, ...doc.data() } as Discipline);
    });
    if (querySnapshot.docs.length > 0) {
      setLastVisibleDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
    }
    return fetchedDisciplines;
  }, [generalSkillId]);

  const fetchNextMostUsed = useCallback(async (): Promise<Discipline[]> => {
    if (!generalSkillId || !lastVisibleDoc) return [];
    console.log("Attempting to fetch next most used disciplines for:", generalSkillId);
    const disciplinesRef = collection(db, "disciplines");
    const q = query(
      disciplinesRef,
      where("generalSkillId", "==", generalSkillId),
      orderBy("selectionCount", "desc"),
      limit(3),
      where("id", "!in", recommendations.map(r => r.id)), // Exclude already fetched
      // startAfter(lastVisibleDoc) // This might skip docs with same selectionCount if not careful with ordering
    );
    // A more robust pagination for "next most used" would ideally need to handle ties in selectionCount
    // or fetch more and filter, or use a different strategy if startAfter isn't perfect for this case.
    // For now, we'll use a simpler approach by filtering out already seen IDs.
    // A better way for pagination with "selectionCount" would be to also order by a secondary unique field if counts are often tied.
    // Or, fetch N+M, skip M already seen, take N.
    // Given the constraints, filtering client-side after fetching a slightly larger batch if startAfter is problematic.
    // Let's try fetching and then filtering out already present ones.
    // We'll fetch a few more and then filter.
    const extendedLimit = limit(3 + recommendations.length); // Fetch more to filter
    const qExtended = query(
      disciplinesRef,
      where("generalSkillId", "==", generalSkillId),
      orderBy("selectionCount", "desc"),
      extendedLimit // Fetch more to filter client-side
    );

    const querySnapshot = await getDocs(qExtended);
    const fetchedDisciplines: Discipline[] = [];
    querySnapshot.forEach((doc) => {
        const discipline = { id: doc.id, ...doc.data() } as Discipline;
        if (!recommendations.find(r => r.id === discipline.id)) { // Ensure not already in recommendations
            fetchedDisciplines.push(discipline);
        }
    });
    // Take the top 3 from the new ones
    const newUniqueDisciplines = fetchedDisciplines.slice(0, 3);
    if (querySnapshot.docs.length > 0) {
         // This lastVisibleDoc update isn't ideal for "next most used" with potential duplicate selectionCounts
         // A cursor based on multiple fields or a different pagination strategy would be more robust.
         // For this iteration, we'll update it, but acknowledge its limitations.
        setLastVisibleDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
    }
    return newUniqueDisciplines;
  }, [generalSkillId, lastVisibleDoc, recommendations]);

  const fetchMostRecent = useCallback(async (): Promise<Discipline[]> => {
    if (!generalSkillId) return [];
    console.log("Attempting to fetch most recent disciplines for:", generalSkillId);
    const disciplinesRef = collection(db, "disciplines");
    const q = query(
      disciplinesRef,
      where("generalSkillId", "==", generalSkillId),
      orderBy("createdAt", "desc"),
      limit(3)
    );
    const querySnapshot = await getDocs(q);
    const fetchedDisciplines: Discipline[] = [];
    querySnapshot.forEach((doc) => {
      fetchedDisciplines.push({ id: doc.id, ...doc.data() } as Discipline);
    });
    // No need to setLastVisibleDoc here as it's for selectionCount pagination
    return fetchedDisciplines;
  }, [generalSkillId]);

  const fetchAIRecommendations = useCallback(async (): Promise<Discipline[]> => {
    if (!currentGeneralSkill) {
      console.error("General skill details not available for AI recommendations.");
      setError("General skill details not available for AI recommendations.");
      return [];
    }
    console.log("Attempting to fetch AI recommendations for:", currentGeneralSkill.name);
    setIsLoading(true); // Specific loading for AI
    setError(null);

    try {
      const skillDescription = (currentGeneralSkill as any).description || currentGeneralSkill.name;
      if (!(currentGeneralSkill as any).description) {
        console.warn(`GeneralSkill ${currentGeneralSkill.id} is missing a description. Using name as fallback for AI prompt.`);
      }

      const aiInput = {
        skillName: currentGeneralSkill.name,
        skillDescription: skillDescription,
        existingDisciplineTitles: recommendations.map(d => d.name),
        generalSkillId: currentGeneralSkill.id // Added generalSkillId
      };
      
      const aiOutput = await suggestDisciplinesForSkill(aiInput);

      if (aiOutput && aiOutput.suggestions) {
        const aiDisciplines: Discipline[] = aiOutput.suggestions.map((sug, index) => ({
          id: `ai-generated-${Date.now()}-${index}`, // Temporary unique ID
          name: sug.title,
          description: sug.description,
          difficulty: sug.difficulty as 'Easy' | 'Medium' | 'Hard', // Cast to type
          generalSkillId: currentGeneralSkill.id,
          isAIGenerated: true,
          selectionCount: 0,
          // createdAt and updatedAt can be set if these items are persisted
          // For now, they are transient and will be handled if user selects them
        }));
        return aiDisciplines;
      }
      return [];
    } catch (err: any) {
      console.error("Error fetching AI recommendations:", err);
      setError(err.message || "Failed to fetch AI recommendations.");
      return [];
    } finally {
      setIsLoading(false); // Specific loading for AI
    }
  }, [currentGeneralSkill, recommendations]); // Removed generalSkillId as currentGeneralSkill dependency covers it

  const getNextRecommendations = useCallback(async () => {
    // Main isLoading is handled here
    setIsLoading(true);
    setError(null);
    let newRecs: Discipline[] = [];
    let fetchedSuccessfully = false;

    try {
      switch (recommendationAttemptCount) {
        case 0:
          newRecs = await fetchMostUsed();
          break;
        case 1:
          newRecs = await fetchNextMostUsed();
          break;
        case 2:
          newRecs = await fetchMostRecent();
          break;
        case 3:
          if (!currentGeneralSkill) {
            setError("Detalles de la habilidad general no cargados para recomendaciones AI.");
            setIsLoading(false);
            return;
          }
          newRecs = await fetchAIRecommendations();
          break;
        default:
          setError("No more recommendation strategies available.");
          setIsLoading(false);
          return;
      }

      if (newRecs.length > 0) {
        // Filter out duplicates based on ID before adding to recommendations
        const uniqueNewRecs = newRecs.filter(nr => !recommendations.find(pr => pr.id === nr.id));
        if (uniqueNewRecs.length > 0) {
            setRecommendations(prevRecs => [...prevRecs, ...uniqueNewRecs]);
        }
        fetchedSuccessfully = true;
      } else if (recommendationAttemptCount < 3) { // If no new recs and not AI attempt yet
          // Potentially auto-try next strategy or inform user
          console.log(`No new recommendations from attempt ${recommendationAttemptCount}. User might need to click again or we can auto-advance.`);
      }
      
      // Only increment if the fetch was successful or if it was an AI attempt (which might return 0 valid new ones)
      // Or if we want to advance regardless of finding new ones.
      // For now, increment if no error, to allow user to try next strategy.
      setRecommendationAttemptCount(prevCount => prevCount + 1);

    } catch (err: any) {
      console.error(`Error fetching recommendations (attempt ${recommendationAttemptCount}):`, err);
      setError(err.message || "Failed to fetch recommendations.");
    } finally {
      setIsLoading(false);
    }
  }, [recommendationAttemptCount, fetchMostUsed, fetchNextMostUsed, fetchMostRecent, fetchAIRecommendations, currentGeneralSkill, recommendations]);

  useEffect(() => {
    setRecommendations([]);
    setRecommendationAttemptCount(0);
    setError(null);
    setLastVisibleDoc(null); // Reset pagination cursor

    const fetchGeneralSkillDetails = async () => {
      if (generalSkillId) {
        setIsLoading(true);
        try {
          const skillDocRef = doc(db, "generalSkills", generalSkillId);
          const skillDocSnap = await getDoc(skillDocRef);
          if (skillDocSnap.exists()) {
            setCurrentGeneralSkill({ id: skillDocSnap.id, ...skillDocSnap.data() } as GeneralSkill);
          } else {
            setError(`General Skill with ID ${generalSkillId} not found.`);
            setCurrentGeneralSkill(null);
          }
        } catch (error: any) {
          console.error("Error fetching general skill details:", error);
          setError(error.message || "Failed to fetch general skill details.");
          setCurrentGeneralSkill(null);
        } finally {
          setIsLoading(false); // This isLoading should ideally be separate or handled carefully
        }
      } else {
        setCurrentGeneralSkill(null);
      }
    };

    fetchGeneralSkillDetails();
    // Initial recommendations will be fetched when user clicks the button.
  }, [generalSkillId]);

  const handleSelectDiscipline = async (disciplineId: string) => {
    console.log(`Discipline selected: ${disciplineId}, incrementing selectionCount.`);
    const disciplineRef = doc(db, "disciplines", disciplineId);
    try {
      await updateDoc(disciplineRef, {
        selectionCount: increment(1)
      });
      // Optionally, give user feedback or update local state if needed
    } catch (error) {
      console.error("Error updating selection count:", error);
      // Handle error (e.g., show a toast to the user)
    }
  };

  return (
    <div className="p-4 border rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-3">Recomendaciones para {currentGeneralSkill?.name || generalSkillId}</h3>
      
      {isLoading && ( 
        <div className="flex items-center justify-center my-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2">Buscando disciplinas...</p>
        </div>
      )}

      {error && !isLoading && ( // Show error only if not loading something else
        <div className="my-4 p-3 bg-destructive/10 text-destructive rounded-md flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2" />
          <p>{error}</p>
        </div>
      )}

      {recommendations.length > 0 && (
        <ul className="space-y-2 mb-4">
          {recommendations.map((rec) => (
            <li key={rec.id} className="p-3 bg-card rounded-md border">
              <h4 className="font-medium">
                {rec.name}
                {rec.isAIGenerated && <span className="text-xs text-primary ml-2">(Sugerencia IA)</span>}
              </h4>
              <p className="text-sm text-muted-foreground line-clamp-2">{rec.description}</p>
              <p className="text-xs text-muted-foreground">Dificultad: {rec.difficulty || 'No especificada'}</p>
              {!rec.isAIGenerated && (
                <Button variant="link" size="sm" className="p-0 h-auto mt-1" onClick={() => handleSelectDiscipline(rec.id)}>
                  Seleccionar esta Disciplina (test) 
                </Button>
              )}
              {/* TODO: Add a way to "add" an AI generated discipline, which would then save it to Firestore */}
            </li>
          ))}
        </ul>
      )}

      {recommendations.length === 0 && !isLoading && !error && recommendationAttemptCount < 4 && (
         <p className="text-muted-foreground text-center my-4">
           {recommendationAttemptCount === 0 && (!currentGeneralSkill || !currentGeneralSkill.id) && "Esperando detalles de habilidad general..."}
           {recommendationAttemptCount === 0 && currentGeneralSkill?.id && "Pulsa el botón para buscar disciplinas."}
           {recommendationAttemptCount > 0 && "No se encontraron más disciplinas con la estrategia actual."}
         </p>
      )}
      
      {recommendationAttemptCount < 4 && !isLoading && currentGeneralSkill?.id && ( 
        <Button 
          onClick={getNextRecommendations} 
          disabled={isLoading || (recommendationAttemptCount === 3 && !currentGeneralSkill?.name)} // Ensure name is present for AI
          className="w-full"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          {recommendationAttemptCount === 0 ? "Buscar Disciplinas" : "Más Ideas"}
          {recommendationAttemptCount === 3 && currentGeneralSkill?.name && " (Usar IA ✨)"}
        </Button>
      )}
       {recommendationAttemptCount >= 4 && !isLoading && !error && (
        <p className="text-muted-foreground text-center my-4">
          Has explorado todas las sugerencias para {currentGeneralSkill?.name || "esta habilidad"}.
        </p>
      )}
    </div>
  );
};

export default DisciplineRecommender;
