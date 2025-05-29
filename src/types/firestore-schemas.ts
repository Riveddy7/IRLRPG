import { Timestamp } from 'firebase/firestore';

export interface GeneralSkill {
  id: string; // document ID, e.g., 'activity_physical'
  name: string; // e.g., 'Activity Físical'
}

export interface Discipline {
  id: string; // Firestore auto-generated ID
  name: string;
  description: string;
  generalSkillId: string; // references GeneralSkill.id
  isAIGenerated: boolean;
  selectionCount: number;
  createdAt: Timestamp; // Firestore Timestamp type
  updatedAt: Timestamp; // Firestore Timestamp type
  difficulty?: 'Easy' | 'Hard' | 'Medium'; // optional, use 'Easy' | 'Hard' to align with existing AI
}

export const GENERAL_SKILLS: GeneralSkill[] = [
  { id: 'activity_physical', name: 'Actividad Física' },
  { id: 'nutrition', name: 'Nutrición' },
  { id: 'mental_focus', name: 'Enfoque Mental' },
  { id: 'emotional_regulation', name: 'Regulación Emocional' },
  { id: 'learning_education', name: 'Aprendizaje y Educación' },
  { id: 'social_relationships', name: 'Relaciones Sociales' },
  { id: 'communication', name: 'Comunicación' },
  { id: 'productivity_organization', name: 'Productividad y Organización' },
  { id: 'finance_wealth', name: 'Finanzas y Riqueza' },
  { id: 'creativity_hobbies', name: 'Creatividad y Hobbies' },
  { id: 'rest_recovery', name: 'Descanso y Recuperación' },
  { id: 'mindfulness_spirituality', name: 'Mindfulness y Espiritualidad' },
  { id: 'career_professional_development', name: 'Carrera y Desarrollo Profesional' },
  { id: 'personal_care_hygiene', name: 'Cuidado Personal e Higiene' },
  { id: 'environmental_responsibility', name: 'Responsabilidad Ambiental' },
  { id: 'other', name: 'Other' },
];
