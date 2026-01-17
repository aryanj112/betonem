"use client";

import { calculateOdds } from "@/lib/utils/calculations";
import { cn } from "@/lib/utils";

interface OddsDisplayProps {
  yesPool: number;
  noPool: number;
  className?: string;
}

export function OddsDisplay({ yesPool, noPool, className }: OddsDisplayProps) {
  const { yesPercentage, noPercentage } = calculateOdds(yesPool, noPool);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm font-medium">
        <span className="text-green-400">YES {yesPercentage}%</span>
        <span className="text-muted-foreground">Current Odds</span>
        <span className="text-red-400">NO {noPercentage}%</span>
      </div>
      
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="bg-green-500 transition-all duration-300"
          style={{ width: `${yesPercentage}%` }}
        />
        <div
          className="bg-red-500 transition-all duration-300"
          style={{ width: `${noPercentage}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{yesPool} coins</span>
        <span>{noPool} coins</span>
      </div>
    </div>
  );
}

