
"use client";
import type { Task, TaskStatus } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Edit, AlertTriangle, Flag, Info, Trash2, CircleHelp, LoaderCircle, Target, Zap, Coins } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TASK_STATUS_OPTIONS, TASK_REWARDS } from '@/config/game-config';
import { useLifeQuest } from '@/hooks/use-life-quest-store';

interface TaskCardProps {
  task: Task;
  onEdit: () => void;
}

const priorityIcons: Record<Task['priority'], React.ElementType> = {
  Low: Flag,
  Medium: Info,
  High: AlertTriangle,
  Critical: AlertTriangle,
};

const priorityColors: Record<Task['priority'], string> = {
  Low: 'text-green-400',
  Medium: 'text-blue-400',
  High: 'text-yellow-400',
  Critical: 'text-red-500',
};

const statusIcons: Record<TaskStatus, React.ElementType> = {
  'To Do': CircleHelp,
  'In Progress': LoaderCircle,
  'Done': CheckCircle2,
}

const statusColors: Record<TaskStatus, string> = {
  'To Do': 'bg-muted text-muted-foreground',
  'In Progress': 'bg-blue-500 text-white',
  'Done': 'bg-green-500 text-white',
}

export function TaskCard({ task, onEdit }: TaskCardProps) {
  const { updateTaskStatus, deleteTask } = useLifeQuest();
  const PriorityIcon = priorityIcons[task.priority];
  const StatusIcon = statusIcons[task.status];

  const rewards = task.difficulty === 'Easy' ? TASK_REWARDS.EASY : TASK_REWARDS.HARD;

  return (
    <Card className="shadow-lg rounded-lg overflow-hidden bg-card/90 backdrop-blur-sm hover:shadow-primary/30 transition-shadow duration-300">
      <CardHeader className="p5-panel-header !py-3 !px-4 flex flex-row justify-between items-center">
        <CardTitle className="text-lg truncate" title={task.title}>{task.title}</CardTitle>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="text-xs">{task.difficulty}</Badge>
          <Badge variant={task.status === 'Done' ? 'default' : 'secondary'} className={`text-xs ${statusColors[task.status]}`}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {task.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {task.description && <CardDescription className="text-sm text-muted-foreground line-clamp-2">{task.description}</CardDescription>}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center">
            <PriorityIcon className={`mr-1.5 h-4 w-4 ${priorityColors[task.priority]}`} />
            Prioridad: <span className={`font-semibold ml-1 ${priorityColors[task.priority]}`}>{task.priority}</span>
          </div>
          {task.dueDate && (
            <span>Vence: {format(parseISO(task.dueDate), 'MMM dd, yyyy')}</span>
          )}
        </div>
        {task.targetStat && (
          <div className="flex items-center text-xs text-muted-foreground">
            <Target className="mr-1.5 h-4 w-4 text-accent" />
            Habilidad Asociada: <span className="font-semibold ml-1 text-foreground">{task.targetStat}</span>
          </div>
        )}
        <div className="flex items-center text-xs text-muted-foreground">
          <Zap className="mr-1.5 h-4 w-4 text-yellow-400" />
          Puntos: <span className="font-semibold ml-1 text-green-400">+{rewards.XP}</span>
          <Coins className="ml-3 mr-1.5 h-4 w-4 text-amber-500" />
          Créditos: <span className="font-semibold ml-1 text-amber-400">+{rewards.COINS}</span>
        </div>
      </CardContent>
      <CardFooter className="p-4 bg-muted/20 flex justify-between items-center">
        <Select
            value={task.status}
            onValueChange={(newStatus) => updateTaskStatus(task.id, newStatus as TaskStatus)}
            disabled={task.status === 'Done'}
          >
          <SelectTrigger className="w-[150px] h-9 text-xs rounded-sm disabled:opacity-70 disabled:cursor-not-allowed" aria-label="Change task status">
            <SelectValue placeholder="Cambiar Estado" />
          </SelectTrigger>
          <SelectContent>
            {TASK_STATUS_OPTIONS.map((status) => (
              <SelectItem key={status} value={status} className="text-xs">
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex space-x-2">
           <Button variant="ghost" size="icon" onClick={onEdit} className="h-8 w-8 hover:text-accent" aria-label="Edit task">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => deleteTask(task.id)} className="h-8 w-8 hover:text-destructive" aria-label="Delete task">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
