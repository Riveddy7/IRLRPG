"use client";
import React, { useState } from 'react';
import { TaskCard } from '@/components/tasks/task-card';
import { TaskForm } from '@/components/tasks/task-form';
import { Button } from '@/components/ui/button';
import { PlusCircle, ListFilter, AlertTriangle } from 'lucide-react';
import { useLifeQuest } from '@/hooks/use-life-quest-store';
import type { Task } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type TaskFilterStatus = "All" | Task["status"];

export default function TasksPage() {
  const { tasks, addTask, updateTask, isLoading } = useLifeQuest();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<TaskFilterStatus>("All");

  const handleOpenForm = (task: Task | null = null) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setEditingTask(null);
    setIsFormOpen(false);
  };

  const handleSubmitForm = (data: any) => { // data type from TaskFormValues
    const taskData = {
        ...data,
        dueDate: data.dueDate ? data.dueDate.toISOString() : undefined,
    };
    if (editingTask) {
      updateTask(editingTask.id, taskData);
    } else {
      addTask(taskData);
    }
    handleCloseForm();
  };

  const filteredTasks = tasks.filter(task => {
    if (filterStatus === "All") return true;
    return task.status === filterStatus;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());


  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-60 rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight p5-text-shadow">Your Missions</h1>
        <Button onClick={() => handleOpenForm()} className="p5-button-accent w-full sm:w-auto">
          <PlusCircle className="mr-2 h-5 w-5" /> New Mission
        </Button>
      </div>

      <Tabs value={filterStatus} onValueChange={(value) => setFilterStatus(value as TaskFilterStatus)}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto sm:h-10">
          <TabsTrigger value="All">All</TabsTrigger>
          <TabsTrigger value="To Do">To Do</TabsTrigger>
          <TabsTrigger value="In Progress">In Progress</TabsTrigger>
          <TabsTrigger value="Done">Done</TabsTrigger>
        </TabsList>
      </Tabs>

      {filteredTasks.length === 0 ? (
        <div className="text-center py-12 bg-card/50 rounded-lg shadow">
          <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
          <h3 className="mt-4 text-xl font-semibold text-muted-foreground">No Missions Here</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {filterStatus === "All" 
              ? "Looks like your mission log is empty. Time to find some quests!" 
              : `No missions currently marked as "${filterStatus}".`}
          </p>
          {filterStatus === "All" && (
            <Button onClick={() => handleOpenForm()} className="mt-6 p5-button-primary">
              <PlusCircle className="mr-2 h-4 w-4" /> Add First Mission
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTasks.map((task) => (
            <TaskCard key={task.id} task={task} onEdit={() => handleOpenForm(task)} />
          ))}
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-lg bg-card">
          <DialogHeader>
            <DialogTitle className="text-2xl p5-text-shadow">{editingTask ? 'Edit Mission' : 'Add New Mission'}</DialogTitle>
            <DialogDescription>
              {editingTask ? 'Update the details of this ongoing mission.' : 'Define your next objective.'}
            </DialogDescription>
          </DialogHeader>
          <TaskForm
            task={editingTask}
            onSubmit={handleSubmitForm}
            onCancel={handleCloseForm}
            submitButtonText={editingTask ? 'Update Mission' : 'Launch Mission'}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
