/**
 * Validation utilities
 */

/**
 * Validate Venmo handle format
 * Venmo handles are alphanumeric with underscores/hyphens, usually prefixed with @
 * Example: @johndoe, johndoe123
 */
export function validateVenmoHandle(handle: string): { valid: boolean; error?: string } {
  if (!handle || typeof handle !== "string") {
    return { valid: false, error: "Venmo handle is required" };
  }

  const cleaned = handle.trim().replace(/^@/, ""); // Remove @ prefix if present

  if (cleaned.length < 3 || cleaned.length > 30) {
    return { valid: false, error: "Venmo handle must be 3-30 characters" };
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(cleaned)) {
    return { valid: false, error: "Venmo handle can only contain letters, numbers, underscores, and hyphens" };
  }

  return { valid: true };
}

/**
 * Validate bet amount (in cents)
 */
export function validateStakeAmount(amountCents: number): { valid: boolean; error?: string } {
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    return { valid: false, error: "Stake amount must be a positive integer (cents)" };
  }

  if (amountCents < 100) {
    return { valid: false, error: "Minimum stake is $1.00 (100 cents)" };
  }

  if (amountCents > 1000000) {
    return { valid: false, error: "Maximum stake is $10,000.00 (1,000,000 cents)" };
  }

  return { valid: true };
}
