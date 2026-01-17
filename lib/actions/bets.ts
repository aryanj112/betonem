"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { validateBetAmount } from "@/lib/utils/validation";

export async function placeBet(
  marketId: string,
  position: boolean, // true = YES, false = NO
  amount: number
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Get market details
  const { data: market, error: marketError } = await supabase
    .from("markets")
    .select("*, groups(id)")
    .eq("id", marketId)
    .single();

  if (marketError || !market) {
    return { error: "Market not found" };
  }

  // Check market is open
  if (market.status !== "open") {
    return { error: "Market is closed" };
  }

  // Get user's membership and balance
  const { data: membership, error: memberError } = await supabase
    .from("group_members")
    .select("balance")
    .eq("group_id", market.group_id)
    .eq("user_id", user.id)
    .single();

  if (memberError || !membership) {
    return { error: "You are not a member of this group" };
  }

  // Validate amount (minimum check only, allow going into debt)
  if (amount < 1) {
    return { error: "Bet amount must be at least $1" };
  }
  
  if (amount > 10000) {
    return { error: "Bet amount cannot exceed $10,000" };
  }

  // Start transaction-like operations
  try {
    // Insert new bet (trigger will handle pool updates)
    const { error: betError } = await supabase
      .from("bets")
      .insert({
        market_id: marketId,
        user_id: user.id,
        position,
        amount,
      });

    if (betError) throw betError;

    // Update user balance (allow going negative - debt system)
    const balanceChange = -amount; // Always subtract the new bet amount
    const newBalance = membership.balance + balanceChange;
    
    const { error: balanceError } = await supabase
      .from("group_members")
      .update({ balance: newBalance })
      .eq("group_id", market.group_id)
      .eq("user_id", user.id);

    if (balanceError) throw balanceError;

    revalidatePath(`/groups/${market.group_id}/bets/${marketId}`);
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to place bet" };
  }
}

