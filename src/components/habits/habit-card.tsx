
"use client";
import type { Habit } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Edit, Flame, Repeat, Target, Trash2, TrendingUp, TrendingDown, Zap, Coins } from 'lucide-react';
import { useLifeQuest } from '@/hooks/use-life-quest-store';
import { HABIT_REWARDS } from '@/config/game-config';

interface HabitCardProps {
  habit: Habit;
  onEdit: () => void;
}

export function HabitCard({ habit, onEdit }: HabitCardProps) {
  const { completeHabit, deleteHabit } = useLifeQuest();
  const TypeIcon = habit.type === 'Good' ? TrendingUp : TrendingDown;

  const getFrequencyText = () => {
    if (Array.isArray(habit.frequency)) {
      return habit.frequency.join(', ');
    }
    return habit.frequency;
  };

  const rewards = habit.type === 'Good' 
    ? (habit.difficulty === 'Easy' ? HABIT_REWARDS.GOOD.EASY : HABIT_REWARDS.GOOD.HARD)
    : (habit.difficulty === 'Easy' ? HABIT_REWARDS.BAD.EASY : HABIT_REWARDS.BAD.HARD);
  
  const xpToShow = rewards.XP > 0 ? `+${rewards.XP}` : `${rewards.XP}`;

  return (
    <Card className="shadow-lg rounded-lg overflow-hidden bg-card/90 backdrop-blur-sm hover:shadow-primary/30 transition-shadow duration-300">
      <CardHeader className="p5-panel-header !py-3 !px-4 flex flex-row justify-between items-center">
        <CardTitle className="text-lg truncate" title={habit.title}>{habit.title}</CardTitle>
        <div className="flex items-center space-x-2">
            <Badge variant={habit.type === 'Good' ? 'default' : 'destructive'} className="text-xs">
                <TypeIcon className="w-3 h-3 mr-1" />
                {habit.type}
            </Badge>
            <Badge variant="secondary" className="text-xs">{habit.difficulty}</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {habit.description && <CardDescription className="text-sm text-muted-foreground line-clamp-2">{habit.description}</CardDescription>}
        
        <div className="flex items-center text-xs text-muted-foreground">
          <Repeat className="mr-1.5 h-4 w-4 text-primary" />
          Frecuencia: <span className="font-semibold ml-1 text-foreground">{getFrequencyText()}</span>
        </div>
        
        {habit.targetStat && (
          <div className="flex items-center text-xs text-muted-foreground">
            <Target className="mr-1.5 h-4 w-4 text-accent" />
            Skill Objetivo: <span className="font-semibold ml-1 text-foreground">{habit.targetStat}</span>
          </div>
        )}

        <div className="flex items-center text-xs text-muted-foreground">
            <Zap className="mr-1.5 h-4 w-4 text-yellow-400" />
            XP: <span className={`font-semibold ml-1 ${rewards.XP > 0 ? 'text-green-400' : 'text-red-400'}`}>{xpToShow}</span>
            <Coins className="ml-3 mr-1.5 h-4 w-4 text-amber-500" />
            Monedas: <span className="font-semibold ml-1 text-amber-400">+{rewards.COINS}</span>
        </div>
        
        <div className="flex items-center text-xs text-muted-foreground">
          <Flame className="mr-1.5 h-4 w-4 text-orange-500" />
          Racha Actual: <span className="font-bold text-orange-400">{habit.currentStreak}</span>
          <span className="mx-2">|</span>
          Más Larga: <span className="font-semibold text-orange-500">{habit.longestStreak}</span>
        </div>
      </CardContent>
      <CardFooter className="p-4 bg-muted/20 flex justify-between items-center">
        <Button 
          onClick={() => completeHabit(habit.id)} 
          size="sm" 
          className={`${habit.type === 'Good' ? 'p5-button-primary' : 'bg-destructive hover:bg-destructive/90'} text-sm`}
        >
          <CheckSquare className="mr-2 h-4 w-4" /> {habit.type === 'Good' ? 'Marcar Hecho' : 'Registrar Hábito'}
        </Button>
        <div className="flex space-x-2">
          <Button variant="ghost" size="icon" onClick={onEdit} className="h-8 w-8 hover:text-accent" aria-label="Editar disciplina">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => deleteHabit(habit.id)} className="h-8 w-8 hover:text-destructive" aria-label="Eliminar disciplina">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
