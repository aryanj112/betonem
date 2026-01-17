"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { placeBet } from "@/lib/actions/bets";
import { calculatePayout, calculateProfit, formatCoins } from "@/lib/utils/calculations";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface PlaceBetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  marketId: string;
  yesPool: number;
  noPool: number;
  userBalance: number;
}

export function PlaceBetModal({
  open,
  onOpenChange,
  marketId,
  yesPool,
  noPool,
  userBalance,
}: PlaceBetModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [position, setPosition] = useState(true);
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const numAmount = parseInt(amount) || 0;
  const newBalance = userBalance - numAmount;

  // Calculate potential payout
  const payout = numAmount > 0 ? calculatePayout(numAmount, position, yesPool, noPool) : 0;
  const profit = numAmount > 0 ? calculateProfit(numAmount, position, yesPool, noPool) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await placeBet(marketId, position, numAmount);

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success!",
          description: "Bet placed",
        });
        setAmount(""); // Reset form
        setPosition(true);
        onOpenChange(false);
        
        // Small delay to ensure trigger has completed
        setTimeout(() => {
          router.refresh();
        }, 300);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to place bet",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const quickAmounts = [50, 100, 250, 500];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Place Bet</DialogTitle>
          <DialogDescription>
            Current balance: {formatCoins(userBalance)}
            {newBalance < 0 && (
              <span className="text-yellow-600 ml-2">
                (New balance: {formatCoins(newBalance)})
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Position Selection */}
          <div className="space-y-2">
            <Label>Your Position</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPosition(true)}
                className={cn(
                  "p-4 rounded-lg border-2 font-semibold transition-all",
                  position
                    ? "border-green-500 bg-green-500/20 text-green-400"
                    : "border-border hover:border-green-500/50 text-foreground"
                )}
              >
                YES
              </button>
              <button
                type="button"
                onClick={() => setPosition(false)}
                className={cn(
                  "p-4 rounded-lg border-2 font-semibold transition-all",
                  !position
                    ? "border-red-500 bg-red-500/20 text-red-400"
                    : "border-border hover:border-red-500/50 text-foreground"
                )}
              >
                NO
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              min="1"
              max="10000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              required
            />
            <div className="flex gap-2">
              {quickAmounts.map((qa) => (
                <Button
                  key={qa}
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setAmount(qa.toString())}
                >
                  ${qa}
                </Button>
              ))}
            </div>
          </div>

          {/* Payout Preview */}
          {numAmount > 0 && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium text-foreground">
                If {position ? "YES" : "NO"} wins:
              </p>
              <p className="text-2xl font-bold text-foreground">
                {formatCoins(payout)}
              </p>
              <p className="text-sm text-muted-foreground">
                {profit > 0 ? "+" : ""}{formatCoins(profit)} profit
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2">
            <Button type="submit" className="w-full" disabled={isLoading || numAmount === 0}>
              {isLoading ? "Processing..." : "Place Bet"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

