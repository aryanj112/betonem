"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { formatCoins } from "@/lib/utils/calculations";
import { cn } from "@/lib/utils";

interface ResolvedBet {
  id: string;
  title: string;
  outcome: boolean | null;
  yes_pool: number;
  no_pool: number;
  resolved_at: string;
  status: string;
}

interface ResolvedBetsListProps {
  groupId: string;
  resolvedBets: ResolvedBet[];
}

export function ResolvedBetsList({ groupId, resolvedBets }: ResolvedBetsListProps) {
  const [showHistory, setShowHistory] = useState(false);

  if (!resolvedBets || resolvedBets.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          Resolved Bets ({resolvedBets.length})
        </h2>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowHistory(!showHistory)}
        >
          {showHistory ? (
            <>
              <ChevronUp className="w-4 h-4 mr-2" />
              Hide History
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 mr-2" />
              View History
            </>
          )}
        </Button>
      </div>

      {showHistory && (
        <div className="space-y-3">
          {resolvedBets.map((bet) => (
            <Link
              key={bet.id}
              href={`/groups/${groupId}/bets/${bet.id}`}
              className="block"
            >
              <div className="bg-card rounded-lg p-4 border border-border hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground mb-2">{bet.title}</h3>
                    <div className="flex items-center gap-3 text-sm">
                      {bet.status === "cancelled" ? (
                        <span className="px-2 py-1 rounded bg-muted text-muted-foreground text-xs font-medium">
                          Cancelled
                        </span>
                      ) : (
                        <span className={cn(
                          "px-2 py-1 rounded text-xs font-medium",
                          bet.outcome 
                            ? "bg-green-500/20 text-green-400" 
                            : "bg-red-500/20 text-red-400"
                        )}>
                          {bet.outcome ? "YES" : "NO"} Won
                        </span>
                      )}
                      <span className="text-muted-foreground">
                        Pool: {formatCoins(bet.yes_pool + bet.no_pool)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

