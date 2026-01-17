export function validateMarketTimes(lockTime: Date, endTime: Date) {
  const now = new Date();
  const maxEndTime = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days

  if (lockTime <= now) {
    return { valid: false, error: "Betting deadline must be in the future" };
  }

  if (endTime <= lockTime) {
    return { valid: false, error: "Resolution date must be after betting deadline" };
  }

  if (endTime > maxEndTime) {
    return { valid: false, error: "Resolution date cannot be more than 90 days in the future" };
  }

  return { valid: true };
}

export function validateBetAmount(amount: number, maxBalance: number) {
  if (amount <= 0) {
    return { valid: false, error: "Bet amount must be greater than 0" };
  }

  if (amount > maxBalance) {
    return { valid: false, error: "Insufficient balance" };
  }

  return { valid: true };
}

export function validateMarketTitle(title: string) {
  const trimmed = title.trim();
  
  if (trimmed.length < 1 || trimmed.length > 200) {
    return { valid: false, error: "Title must be 1-200 characters" };
  }

  return { valid: true, value: trimmed };
}

