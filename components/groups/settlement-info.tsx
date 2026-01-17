"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCoins } from "@/lib/utils/calculations";
import { DollarSign, ArrowRight, ExternalLink } from "lucide-react";
import { Avatar } from "@/components/common/avatar";

interface Member {
  id: string;
  display_name: string;
  username: string;
  avatar_url?: string | null;
  venmo_username?: string | null;
  balance: number;
}

interface Transaction {
  from: Member;
  to: Member;
  amount: number;
}

interface SettlementInfoProps {
  members: Member[];
  groupName?: string;
}

function calculateSettlements(members: Member[]): Transaction[] {
  // Create copies to work with
  const debtors = members
    .filter(m => m.balance < 0)
    .map(m => ({ ...m, remaining: -m.balance }))
    .sort((a, b) => b.remaining - a.remaining);
  
  const creditors = members
    .filter(m => m.balance > 0)
    .map(m => ({ ...m, remaining: m.balance }))
    .sort((a, b) => b.remaining - a.remaining);

  const transactions: Transaction[] = [];

  // Greedy algorithm: match largest debtor with largest creditor
  let i = 0, j = 0;
  
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    
    const amount = Math.min(debtor.remaining, creditor.remaining);
    
    transactions.push({
      from: members.find(m => m.id === debtor.id)!,
      to: members.find(m => m.id === creditor.id)!,
      amount: Math.round(amount), // Round to avoid floating point issues
    });
    
    debtor.remaining -= amount;
    creditor.remaining -= amount;
    
    if (debtor.remaining < 0.01) i++; // Move to next debtor
    if (creditor.remaining < 0.01) j++; // Move to next creditor
  }
  
  return transactions;
}

export function SettlementInfo({ members, groupName }: SettlementInfoProps) {
  const transactions = calculateSettlements(members);
  
  // If no transactions needed, everyone is settled
  if (transactions.length === 0) {
    return (
      <Card className="border-green-500/30 bg-green-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-400">
            <DollarSign className="w-5 h-5" />
            All Settled Up!
          </CardTitle>
          <CardDescription>
            Everyone in {groupName || "this group"} has a zero balance. No payments needed! 🎉
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Who Pays Whom
        </CardTitle>
        <CardDescription>
          {transactions.length} payment{transactions.length !== 1 ? 's' : ''} needed to settle {groupName || "this group"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {transactions.map((transaction, index) => (
          <div 
            key={index}
            className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors"
          >
            {/* From (Debtor) */}
            <div className="flex items-center gap-2 flex-1">
              <Avatar
                src={transaction.from.avatar_url}
                alt={transaction.from.display_name}
                fallback={transaction.from.display_name[0]}
                size="sm"
              />
              <div className="flex-1">
                <p className="font-medium text-foreground">{transaction.from.display_name}</p>
                <p className="text-xs text-muted-foreground">@{transaction.from.username}</p>
              </div>
            </div>

            {/* Arrow and Amount */}
            <div className="flex flex-col items-center gap-1 px-4">
              <ArrowRight className="w-5 h-5 text-primary" />
              <p className="font-bold text-lg text-primary">{formatCoins(transaction.amount)}</p>
            </div>

            {/* To (Creditor) */}
            <div className="flex items-center gap-2 flex-1 justify-end">
              <div className="flex-1 text-right">
                <p className="font-medium text-foreground">{transaction.to.display_name}</p>
                {transaction.to.venmo_username ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-auto p-0 text-xs text-primary hover:text-primary/80"
                    asChild
                  >
                    <a 
                      href={`https://venmo.com/${transaction.to.venmo_username.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {transaction.to.venmo_username} <ExternalLink className="w-3 h-3 ml-1 inline" />
                    </a>
                  </Button>
                ) : (
                  <p className="text-xs text-muted-foreground">@{transaction.to.username}</p>
                )}
              </div>
              <Avatar
                src={transaction.to.avatar_url}
                alt={transaction.to.display_name}
                fallback={transaction.to.display_name[0]}
                size="sm"
              />
            </div>
          </div>
        ))}

        {/* Helpful tip */}
        <div className="bg-muted/50 rounded-lg p-3 mt-4">
          <p className="text-xs text-muted-foreground">
            💡 These payments will settle all debts in the group. Click Venmo usernames to send payment directly.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

