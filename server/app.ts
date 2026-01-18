/**
 * Express App Setup
 */

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import betsRouter from "./routes/bets";
import webhookRouter from "./routes/webhook";
import payoutsRouter from "./routes/payouts";
import { authenticate, requireAdmin } from "./middleware/auth";

const app = express();

// Middleware
app.use(cors());

// JSON parser with raw body preservation for webhook
app.use(
  express.json({
    verify: (req, res, buf) => {
      // Store raw body for webhook signature verification
      (req as any).rawBody = buf.toString("utf8");
    },
  })
);

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Webhook endpoint (no auth, uses signature verification)
app.use("/api/paypal", webhookRouter);

// Protected routes
app.use("/api/bets", authenticate, betsRouter);

// Admin routes
app.use("/api/payouts", authenticate, payoutsRouter);

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

export default app;
