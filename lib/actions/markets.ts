"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { validateMarketTimes, validateMarketTitle } from "@/lib/utils/validation";

export async function createMarket(
  groupId: string,
  title: string,
  description: string | null
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Validate title
  const titleValidation = validateMarketTitle(title);
  if (!titleValidation.valid) {
    return { error: titleValidation.error };
  }

  // Verify user is a group member
  const { data: membership } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return { error: "You are not a member of this group" };
  }

  // Create market (no time restrictions)
  const { data: market, error: marketError } = await supabase
    .from("markets")
    .insert({
      group_id: groupId,
      created_by: user.id,
      title: titleValidation.value,
      description: description?.trim() || null,
      status: "open",
    })
    .select()
    .single();

  if (marketError) {
    return { error: marketError.message };
  }

  revalidatePath(`/groups/${groupId}`);
  return { data: market };
}

export async function resolveMarket(
  marketId: string,
  groupId: string,
  outcome: boolean | null
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  console.log("[resolveMarket] Starting resolution:", { marketId, outcome, userId: user.id });

  // Get market details
  const { data: market, error: marketError } = await supabase
    .from("markets")
    .select("*")
    .eq("id", marketId)
    .single();

  if (marketError || !market) {
    console.error("[resolveMarket] Market not found:", marketError);
    return { error: "Market not found" };
  }

  // Verify user is the creator
  if (market.created_by !== user.id) {
    return { error: "Only the creator can resolve this market" };
  }

  // Verify market is still open
  if (market.status !== "open") {
    return { error: "Market is already resolved" };
  }

  console.log("[resolveMarket] Market details:", { yesPool: market.yes_pool, noPool: market.no_pool });

  // Get all bets
  const { data: bets, error: betsError } = await supabase
    .from("bets")
    .select("*")
    .eq("market_id", marketId);

  if (betsError) {
    console.error("[resolveMarket] Error fetching bets:", betsError);
    return { error: "Failed to fetch bets" };
  }

  console.log("[resolveMarket] Found", bets?.length || 0, "bets");

  // Calculate payouts
  const totalPool = market.yes_pool + market.no_pool;
  
  if (outcome === null) {
    // Cancelled - refund everyone
    console.log("[resolveMarket] Cancelling market - refunding all bets");
    
    for (const bet of bets || []) {
      // Get current balance
      const { data: membership } = await supabase
        .from("group_members")
        .select("balance")
        .eq("group_id", groupId)
        .eq("user_id", bet.user_id)
        .single();

      if (membership) {
        const { error: updateError } = await supabase
          .from("group_members")
          .update({
            balance: membership.balance + bet.amount,
          })
          .eq("group_id", groupId)
          .eq("user_id", bet.user_id);

        if (updateError) {
          console.error("[resolveMarket] Error refunding user:", bet.user_id, updateError);
        } else {
          console.log("[resolveMarket] Refunded", bet.amount, "to user", bet.user_id);
        }
      }
    }
  } else {
    // Resolved - pay winners
    const winningPool = outcome ? market.yes_pool : market.no_pool;
    
    console.log("[resolveMarket] Resolving as", outcome ? "YES" : "NO");
    console.log("[resolveMarket] Winning pool:", winningPool, "Total pool:", totalPool);

    if (winningPool === 0) {
      // No winners - refund everyone
      console.log("[resolveMarket] No winners - refunding all bets");
      
      // Group bets by user
      const userBets = (bets || []).reduce((acc: any, bet: any) => {
        if (!acc[bet.user_id]) {
          acc[bet.user_id] = 0;
        }
        acc[bet.user_id] += bet.amount;
        return acc;
      }, {});

      for (const [userId, totalAmount] of Object.entries(userBets)) {
        // Get current balance
        const { data: membership } = await supabase
          .from("group_members")
          .select("balance")
          .eq("group_id", groupId)
          .eq("user_id", userId)
          .single();

        if (membership) {
          const { error: updateError } = await supabase
            .from("group_members")
            .update({
              balance: membership.balance + (totalAmount as number),
            })
            .eq("group_id", groupId)
            .eq("user_id", userId);

          if (updateError) {
            console.error("[resolveMarket] Error refunding user:", userId, updateError);
          }
        }
      }
    } else {
      // Calculate and distribute payouts to winners
      // Group winning bets by user
      const userWinnings: Record<string, number> = {};
      
      for (const bet of bets || []) {
        if (bet.position === outcome) {
          // Winner - calculate their share
          const payout = Math.floor((bet.amount / winningPool) * totalPool);
          console.log("[resolveMarket] Winner bet:", bet.user_id, "bet:", bet.amount, "payout:", payout);
          
          if (!userWinnings[bet.user_id]) {
            userWinnings[bet.user_id] = 0;
          }
          userWinnings[bet.user_id] += payout;
        } else {
          console.log("[resolveMarket] Loser bet:", bet.user_id, "lost:", bet.amount);
        }
      }

      // Pay out each user once with their total winnings
      for (const [userId, totalPayout] of Object.entries(userWinnings)) {
        console.log("[resolveMarket] Paying user:", userId, "total payout:", totalPayout);
        
        // Get current balance
        const { data: membership } = await supabase
          .from("group_members")
          .select("balance")
          .eq("group_id", groupId)
          .eq("user_id", userId)
          .single();

        if (membership) {
          const { error: updateError } = await supabase
            .from("group_members")
            .update({
              balance: membership.balance + totalPayout,
            })
            .eq("group_id", groupId)
            .eq("user_id", userId);

          if (updateError) {
            console.error("[resolveMarket] Error paying winner:", userId, updateError);
          }
        }
      }
    }
  }

  // Update market status
  const { error: resolveError } = await supabase
    .from("markets")
    .update({
      status: outcome === null ? "cancelled" : "resolved",
      outcome: outcome,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", marketId);

  if (resolveError) {
    console.error("[resolveMarket] Error updating market status:", resolveError);
    return { error: "Failed to update market status" };
  }

  console.log("[resolveMarket] Market resolved successfully");

  revalidatePath(`/groups/${groupId}`);
  revalidatePath(`/groups/${groupId}/bets/${marketId}`);
  
  return { success: true };
}

