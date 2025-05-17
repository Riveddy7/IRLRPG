
import React from 'react';
import { Flame } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
      <div className="mb-8 text-center">
        <Flame className="h-16 w-16 text-primary mx-auto mb-2" />
        <h1 className="text-4xl font-bold tracking-tight p5-text-shadow">
          LifeQuest RPG
        </h1>
        <p className="text-muted-foreground">Forge Your Destiny.</p>
      </div>
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
