/**
 * Authentication middleware (stub implementation)
 * TODO: Implement proper authentication based on your auth system
 */

import { Request, Response, NextFunction } from "express";

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      isAdmin?: boolean;
    }
  }
}

/**
 * Stub authentication middleware
 * In production, verify JWT token, session, etc.
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  // Stub: Extract user ID from header (e.g., Authorization: Bearer <token>)
  // For now, use a header like "X-User-Id" for testing
  const userId = req.headers["x-user-id"] as string;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized: Missing user ID" });
    return;
  }

  req.userId = userId;
  next();
}

/**
 * Admin-only middleware (stub)
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  // Stub: Check if user is admin (e.g., from JWT claims, database, etc.)
  const isAdmin = req.headers["x-is-admin"] === "true";

  if (!isAdmin) {
    res.status(403).json({ error: "Forbidden: Admin access required" });
    return;
  }

  req.isAdmin = true;
  next();
}
