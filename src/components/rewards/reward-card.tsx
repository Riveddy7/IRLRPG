
"use client";
import type { RewardItem } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coins, Edit, Gift, Trash2, ShoppingCart } from 'lucide-react';
import { useLifeQuest } from '@/hooks/use-life-quest-store';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import React from 'react';


interface RewardCardProps {
  reward: RewardItem;
  onEdit: () => void;
  canAfford: boolean;
}

export function RewardCard({ reward, onEdit, canAfford }: RewardCardProps) {
  const { purchaseReward, deleteReward } = useLifeQuest();

  const handlePurchase = () => {
    purchaseReward(reward.id);
  };

  return (
    <Card className="shadow-lg rounded-lg overflow-hidden bg-card/90 backdrop-blur-sm hover:shadow-primary/30 transition-shadow duration-300 flex flex-col justify-between">
      <div>
        <CardHeader className="p5-panel-header !py-3 !px-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg truncate flex items-center" title={reward.title}>
              <Gift className="w-5 h-5 mr-2 text-yellow-300" />
              {reward.title}
            </CardTitle>
            <div className="flex items-center text-sm font-semibold text-primary-foreground">
              <Coins className="w-4 h-4 mr-1 text-yellow-300" />
              {reward.cost}
            </div>
          </div>
        </CardHeader>
        {reward.description && (
          <CardContent className="p-4">
            <CardDescription className="text-sm text-muted-foreground line-clamp-3">
              {reward.description}
            </CardDescription>
          </CardContent>
        )}
      </div>
      <CardFooter className="p-3 bg-muted/20 flex justify-between items-center mt-auto">
        <Button
          onClick={handlePurchase}
          size="sm"
          className="p5-button-accent text-sm"
          disabled={!canAfford}
          aria-label={`Canjear ${reward.title} por ${reward.cost} puntos`}
        >
          <ShoppingCart className="mr-2 h-4 w-4" /> Canjear
        </Button>
        <div className="flex space-x-1">
          <Button variant="ghost" size="icon" onClick={onEdit} className="h-8 w-8 hover:text-accent" aria-label={`Editar recompensa ${reward.title}`}>
            <Edit className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" aria-label={`Eliminar recompensa ${reward.title}`}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro de eliminar esta recompensa?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Esto eliminará permanentemente la recompensa "{reward.title}".
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteReward(reward.id)}
                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                >
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardFooter>
    </Card>
  );
}
