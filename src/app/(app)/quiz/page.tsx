
import { QuizForm } from '@/components/quiz/quiz-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Forja tu Leyenda - LifeQuest RPG',
  description: 'Personaliza tu personaje y define tus atributos iniciales.',
};

export default function QuizPage() {
  return (
    <div className="container mx-auto py-8">
      <QuizForm />
    </div>
  );
}
