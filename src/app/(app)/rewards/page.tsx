
"use client";
import React, { useState } from 'react';
import { RewardCard } from '@/components/rewards/reward-card';
import { RewardForm } from '@/components/rewards/reward-form';
import { Button } from '@/components/ui/button';
import { PlusCircle, Gift, Coins, AlertTriangle } from 'lucide-react';
import { useLifeQuest } from '@/hooks/use-life-quest-store';
import type { RewardItem } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

export default function RewardsPage() {
  const { player, rewards, addReward, updateReward, isLoading } = useLifeQuest();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<RewardItem | null>(null);

  const handleOpenForm = (reward: RewardItem | null = null) => {
    setEditingReward(reward);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setEditingReward(null);
    setIsFormOpen(false);
  };

  const handleSubmitForm = (data: any) => { 
    if (editingReward) {
      updateReward(editingReward.id, data);
    } else {
      addReward(data);
    }
    handleCloseForm();
  };

  if (isLoading || !player) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-8 w-1/2 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-lg" />)}
        </div>
      </div>
    );
  }

  const sortedRewards = [...rewards].sort((a, b) => a.cost - b.cost);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-center sm:text-left">
            <h1 className="text-3xl font-bold tracking-tight p5-text-shadow flex items-center">
            <Gift className="mr-3 h-8 w-8 text-yellow-400" />
            Tienda de Recompensas
            </h1>
            <p className="text-muted-foreground">Canjea tus logros por algo especial.</p>
        </div>
        <div className="flex flex-col items-center sm:items-end gap-2">
            <Button onClick={() => handleOpenForm()} className="p5-button-accent w-full sm:w-auto">
              <PlusCircle className="mr-2 h-5 w-5" /> Configurar Recompensa
            </Button>
             <div className="flex items-center text-lg font-semibold p-2 bg-card/80 rounded-md shadow-md">
                <Coins className="mr-2 h-6 w-6 text-amber-500" />
                <span>{player.coins} Monedas</span>
            </div>
        </div>
      </div>

      {sortedRewards.length === 0 ? (
        <div className="text-center py-12 bg-card/50 rounded-lg shadow">
          <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
          <h3 className="mt-4 text-xl font-semibold text-muted-foreground">Tienda Vacía</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Aún no has configurado ninguna recompensa. ¡Añade algunas para motivarte!
          </p>
          <Button onClick={() => handleOpenForm()} className="mt-6 p5-button-primary">
            <PlusCircle className="mr-2 h-4 w-4" /> Añadir Primera Recompensa
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sortedRewards.map((reward) => (
            <RewardCard
              key={reward.id}
              reward={reward}
              onEdit={() => handleOpenForm(reward)}
              canAfford={player.coins >= reward.cost}
            />
          ))}
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-lg bg-card max-h-[85vh] overflow-y-auto p-0">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="text-2xl p5-text-shadow">
              {editingReward ? 'Editar Recompensa' : 'Configurar Nueva Recompensa'}
            </DialogTitle>
            <DialogDescription>
              {editingReward ? 'Ajusta los detalles de esta recompensa.' : 'Define un nuevo ítem para tu tienda personal.'}
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-6">
            <RewardForm
              reward={editingReward}
              onSubmit={handleSubmitForm}
              onCancel={handleCloseForm}
              submitButtonText={editingReward ? 'Actualizar Recompensa' : 'Añadir Recompensa'}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
