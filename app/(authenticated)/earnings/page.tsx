/**
 * Earnings Page
 * Dashboard for tracking settled bets and winnings/losses
 */

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EarningsHeader } from "@/components/earnings/EarningsHeader";
import { SettlementsList } from "@/components/earnings/SettlementsList";
import { Settlement } from "@/components/earnings/SettlementCard";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { EarningsPageWrapper } from "@/components/earnings/EarningsPageWrapper";
import { connection } from "next/server";
import styles from "@/styles/Earnings.module.css";

async function SettlementsContent() {
  await connection();
  
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  // Get user's profile for Venmo info
  const { data: profile } = await supabase
    .from("users")
    .select("venmo_username")
    .eq("id", user.id)
    .single();

  // Get all user's bets with resolved/cancelled markets
  const { data: userBets } = await supabase
    .from("bets")
    .select(`
      *,
      markets!inner (
        id,
        title,
        status,
        outcome,
        yes_pool,
        no_pool,
        resolved_at,
        group_id,
        groups (
          id,
          name
        )
      )
    `)
    .eq("user_id", user.id)
    .in("markets.status", ["resolved", "cancelled"])
    .order("markets.resolved_at", { ascending: false })
    .limit(50);

  if (!userBets || userBets.length === 0) {
    return { settlements: [], isEmpty: true };
  }

  // Transform bets into settlements
  const settlements: Settlement[] = userBets.map((bet: any) => {
    const market = bet.markets;
    const totalPool = market.yes_pool + market.no_pool;
    const userPosition = bet.position; // true = YES, false = NO
    
    let result: "WON" | "LOST" | "PUSH";
    let amount = 0;

    if (market.status === "cancelled") {
      // Cancelled market - refund (push)
      result = "PUSH";
      amount = 0;
    } else if (market.outcome === null) {
      // Resolved but no outcome (shouldn't happen but handle it)
      result = "PUSH";
      amount = 0;
    } else {
      // Check if user won
      const userWon = userPosition === market.outcome;
      
      if (userWon) {
        // Calculate winnings
        const winningPool = market.outcome ? market.yes_pool : market.no_pool;
        if (winningPool > 0) {
          const payout = Math.floor((bet.amount / winningPool) * totalPool);
          const profit = payout - bet.amount;
          result = "WON";
          amount = profit;
        } else {
          result = "PUSH";
          amount = 0;
        }
      } else {
        // User lost
        result = "LOST";
        amount = -bet.amount;
      }
    }

    // Determine payout method
    const payoutMethod = profile?.venmo_username ? "VENMO" : "PAYPAL";
    
    // For now, all resolved bets are marked as SENT
    // In a real system, you'd track actual payout status separately
    const payoutStatus = "SENT";

    return {
      id: bet.id,
      groupName: market.groups?.name || "Unknown Group",
      groupTag: undefined, // Not storing tags in current schema
      betTitle: market.title,
      result,
      amount,
      settledAt: market.resolved_at || new Date().toISOString(),
      payoutStatus,
      payoutMethod,
      marketId: market.id,
      groupId: market.group_id,
    };
  });

  return { settlements, isEmpty: false };
}

async function SettlementsWrapper() {
  const { settlements, isEmpty } = await SettlementsContent();
  
  return <SettlementsList settlements={settlements} isEmpty={isEmpty} />;
}

export default function EarningsPage() {
  return (
    <EarningsPageWrapper>
      <EarningsHeader />
      <Suspense fallback={<LoadingSpinner />}>
        <SettlementsWrapper />
      </Suspense>
    </EarningsPageWrapper>
  );
}
