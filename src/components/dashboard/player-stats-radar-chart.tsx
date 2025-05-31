
"use client";

import React from 'react';
import type { PlayerStats } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartConfig,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, RadarChart as RechartsRadarChart } from "recharts";
import { MAX_SKILL_LEVEL } from '@/config/game-config';

interface PlayerStatsRadarChartProps {
  stats: PlayerStats;
  statDescriptions?: { [key: string]: string };
}

export function PlayerStatsRadarChart({ stats, statDescriptions }: PlayerStatsRadarChartProps) {
  const chartData = Object.entries(stats).map(([name, data]) => ({
    subject: name,
    value: data.level,
    fullMark: MAX_SKILL_LEVEL,
    description: statDescriptions?.[name] || "Nivel de habilidad.",
  }));

  const chartConfig = {} as ChartConfig;
  chartData.forEach((item) => {
    chartConfig[item.subject] = {
      label: item.subject,
      color: "hsl(var(--chart-1))", // Use primary color from theme
    };
  });

  if (chartData.length === 0) {
    return (
      <Card className="p5-radar-chart-container">
        <CardHeader className="p5-panel-header">
          <CardTitle>Atributos Primordiales</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48">
          <p className="text-muted-foreground">No hay atributos para mostrar en el radar.</p>
        </CardContent>
      </Card>
    );
  }
  
  let displayData = chartData;
  if (chartData.length > 0 && chartData.length < 3) {
    const dummyPointsNeeded = 3 - chartData.length;
    const dummyData = Array(dummyPointsNeeded).fill(null).map((_, i) => ({
        subject: `_dummy${i}`, 
        value: 0, 
        fullMark: MAX_SKILL_LEVEL,
        description: ""
    }));
    displayData = [...chartData, ...dummyData];
  }


  return (
    <Card className="p5-radar-chart-container">
      <CardHeader className="p5-panel-header">
        <CardTitle>Atributos Primordiales</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[300px] sm:max-h-[350px]">
          <RechartsRadarChart data={displayData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value, name, entry) => {
                    if (entry.payload.subject.startsWith('_dummy')) {
                      return null;
                    }
                    return (
                      <div className="flex flex-col items-start p-1">
                        <span className="font-bold text-sm text-foreground">{entry.payload.subject}</span>
                        <span className="text-xs text-muted-foreground">{entry.payload.description}</span>
                        <span className="text-lg font-bold text-accent">Nivel: {value}</span>
                      </div>
                    );
                  }}
                />
              }
            />
            <PolarGrid className="fill-background stroke-border/70" />
            <PolarAngleAxis 
              dataKey="subject" 
              className="p5-stat-label-radar" 
              tick={({ x, y, payload }) => {
                if (payload.value.startsWith('_dummy')) {
                  return null;
                }
                return (
                  <text x={x} y={y} dy={5} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize={10}>
                    {payload.value}
                  </text>
                );
              }}
            />
            <PolarRadiusAxis angle={90} domain={[0, MAX_SKILL_LEVEL]} tickCount={Math.min(MAX_SKILL_LEVEL, 5) +1} tick={false} axisLine={false} />
            <Radar
              name="PlayerStats" 
              dataKey="value"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary) / 0.4)"
              strokeWidth={2.5}
              dot={{
                r: 4,
                strokeWidth: 1,
                fill: "hsl(var(--background))",
                stroke: "hsl(var(--primary))",
              }}
              activeDot={{
                r: 5,
                strokeWidth: 1.5,
                stroke: "hsl(var(--accent))",
                fill: "hsl(var(--accent) / 0.8)"
              }}
            />
          </RechartsRadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
