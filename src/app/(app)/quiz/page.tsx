
import { QuizForm } from '@/components/quiz/quiz-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Define tus Atributos - LifeQuest',
  description: 'Personaliza tu perfil y define tus atributos iniciales con ayuda de la IA.',
};

export default function QuizPage() {
  return (
    <div className="container mx-auto py-8">
      <QuizForm />
    </div>
  );
}
