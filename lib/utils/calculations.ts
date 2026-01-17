/**
 * Calculate odds for YES and NO positions in a parimutuel betting market
 */
export function calculateOdds(yesPool: number, noPool: number) {
  const totalPool = yesPool + noPool;

  if (totalPool === 0) {
    return { yesPercentage: 50, noPercentage: 50 };
  }

  const yesPercentage = Math.round((yesPool / totalPool) * 100);
  const noPercentage = 100 - yesPercentage;

  return { yesPercentage, noPercentage };
}

/**
 * Calculate potential payout for a bet
 */
export function calculatePayout(
  betAmount: number,
  betPosition: boolean, // true = YES, false = NO
  yesPool: number,
  noPool: number
) {
  const totalPool = yesPool + noPool + betAmount;
  const winningPool = betPosition
    ? yesPool + betAmount
    : noPool + betAmount;

  if (winningPool === 0) {
    return 0;
  }

  const payout = (betAmount / winningPool) * totalPool;
  return Math.floor(payout);
}

/**
 * Calculate profit from a potential bet
 */
export function calculateProfit(
  betAmount: number,
  betPosition: boolean,
  yesPool: number,
  noPool: number
) {
  const payout = calculatePayout(betAmount, betPosition, yesPool, noPool);
  return payout - betAmount;
}

/**
 * Calculate actual payouts after market resolution
 */
export function calculateResolutionPayouts(
  bets: Array<{
    user_id: string;
    position: boolean;
    amount: number;
  }>,
  outcome: boolean,
  yesPool: number,
  noPool: number
) {
  const totalPool = yesPool + noPool;
  const winningPool = outcome ? yesPool : noPool;

  if (winningPool === 0) {
    // No winners, everyone gets refunded
    return bets.map((bet) => ({
      user_id: bet.user_id,
      payout: bet.amount,
      profit: 0,
      won: false,
    }));
  }

  return bets.map((bet) => {
    if (bet.position === outcome) {
      // Winner
      const payout = Math.floor((bet.amount / winningPool) * totalPool);
      return {
        user_id: bet.user_id,
        payout,
        profit: payout - bet.amount,
        won: true,
      };
    } else {
      // Loser
      return {
        user_id: bet.user_id,
        payout: 0,
        profit: -bet.amount,
        won: false,
      };
    }
  });
}

/**
 * Format coins with commas
 */
export function formatCoins(amount: number): string {
  return `$${amount.toLocaleString()}`;
}

/**
 * Format profit with + or - sign
 */
export function formatProfit(profit: number): string {
  if (profit > 0) {
    return `+${formatCoins(profit)}`;
  }
  return formatCoins(profit);
}

