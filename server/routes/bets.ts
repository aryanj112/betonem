/**
 * Bet Management Routes
 */

import { Router, Request, Response } from "express";
import { prisma } from "../lib/db";
import { paypalRequest } from "../lib/paypal/client";
import { validateStakeAmount, validateVenmoHandle } from "../lib/validation";
import { requireAdmin } from "../middleware/auth";

const router = Router();

/**
 * POST /api/bets
 * Create a new bet
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const { title, stakeAmount, participantsCount, endsAt } = req.body;
    const userId = req.userId!;

    // Validation
    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return res.status(400).json({ error: "Title is required" });
    }

    if (title.length > 200) {
      return res.status(400).json({ error: "Title must be 200 characters or less" });
    }

    const stakeAmountCents = Math.round((stakeAmount || 0) * 100);
    const stakeValidation = validateStakeAmount(stakeAmountCents);
    if (!stakeValidation.valid) {
      return res.status(400).json({ error: stakeValidation.error });
    }

    if (!endsAt || !Date.parse(endsAt)) {
      return res.status(400).json({ error: "Valid endsAt date is required" });
    }

    const endsAtDate = new Date(endsAt);
    if (endsAtDate <= new Date()) {
      return res.status(400).json({ error: "endsAt must be in the future" });
    }

    // Create bet
    const bet = await prisma.bet.create({
      data: {
        title: title.trim(),
        stakeAmountCents,
        status: "OPEN",
        endsAt: endsAtDate,
      },
    });

    res.status(201).json({
      id: bet.id,
      title: bet.title,
      stakeAmount: bet.stakeAmountCents / 100,
      stakeAmountCents: bet.stakeAmountCents,
      status: bet.status,
      endsAt: bet.endsAt.toISOString(),
      createdAt: bet.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("Error creating bet:", error);
    res.status(500).json({ error: "Failed to create bet" });
  }
});

/**
 * POST /api/bets/:betId/join
 * Join a bet and create PayPal order
 */
router.post("/:betId/join", async (req: Request, res: Response) => {
  try {
    const { betId } = req.params;
    const userId = req.userId!;

    // Check bet exists and is OPEN
    const bet = await prisma.bet.findUnique({
      where: { id: betId },
    });

    if (!bet) {
      return res.status(404).json({ error: "Bet not found" });
    }

    if (bet.status !== "OPEN") {
      return res.status(400).json({ error: `Bet is ${bet.status}, cannot join` });
    }

    // Check user hasn't already joined
    const existing = await prisma.betParticipant.findUnique({
      where: {
        betId_userId: {
          betId,
          userId,
        },
      },
    });

    if (existing) {
      return res.status(400).json({ error: "You have already joined this bet" });
    }

    // Verify user has venmo handle
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { venmoHandle: true },
    });

    if (!user || !user.venmoHandle) {
      return res.status(400).json({ error: "Venmo handle is required to join bets. Please update your profile." });
    }

    const amount = bet.stakeAmountCents / 100;

    // Create PayPal order
    const orderData = {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: amount.toFixed(2),
          },
          description: `Bet: ${bet.title}`,
          custom_id: `${betId}:${userId}`, // For webhook processing
        },
      ],
      application_context: {
        brand_name: "BetOnEm",
        landing_page: "NO_PREFERENCE",
        user_action: "PAY_NOW",
        return_url: `${process.env.APP_URL || "http://localhost:3000"}/bets/${betId}/return`,
        cancel_url: `${process.env.APP_URL || "http://localhost:3000"}/bets/${betId}`,
      },
    };

    const paypalOrder = await paypalRequest<{
      id: string;
      status: string;
      links: Array<{ href: string; rel: string; method: string }>;
    }>("POST", "/v2/checkout/orders", orderData);

    // Find approve URL
    const approveLink = paypalOrder.links?.find((link) => link.rel === "approve");

    if (!approveLink || !approveLink.href) {
      throw new Error("PayPal order created but no approve URL found");
    }

    // Create participant record
    await prisma.betParticipant.create({
      data: {
        betId,
        userId,
        orderId: paypalOrder.id,
        status: "CREATED",
      },
    });

    res.status(201).json({
      orderId: paypalOrder.id,
      approveUrl: approveLink.href,
      status: paypalOrder.status,
    });
  } catch (error) {
    console.error("Error joining bet:", error);
    res.status(500).json({
      error: "Failed to create payment order",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /api/bets/:betId/capture
 * Capture a PayPal order (idempotent)
 */
router.post("/:betId/capture", async (req: Request, res: Response) => {
  try {
    const { betId } = req.params;
    const { orderId } = req.body;
    const userId = req.userId!;

    if (!orderId) {
      return res.status(400).json({ error: "orderId is required" });
    }

    // Verify participant exists and belongs to user
    const participant = await prisma.betParticipant.findFirst({
      where: {
        betId,
        userId,
        orderId,
      },
      include: {
        bet: true,
      },
    });

    if (!participant) {
      return res.status(404).json({ error: "Participant not found for this bet and order" });
    }

    // If already captured, return success
    if (participant.status === "CAPTURED" && participant.captureId) {
      return res.json({
        orderId,
        captureId: participant.captureId,
        status: "CAPTURED",
        message: "Order already captured",
      });
    }

    // Capture the order
    const capture = await paypalRequest<{
      id: string;
      status: string;
      status_details?: { reason?: string };
    }>(`POST`, `/v2/checkout/orders/${orderId}/capture`, {});

    // Update participant based on capture status
    if (capture.status === "COMPLETED") {
      await prisma.betParticipant.update({
        where: { id: participant.id },
        data: {
          status: "CAPTURED",
          captureId: capture.id,
        },
      });

      res.json({
        orderId,
        captureId: capture.id,
        status: "CAPTURED",
      });
    } else {
      // Handle other statuses (PENDING, etc.)
      await prisma.betParticipant.update({
        where: { id: participant.id },
        data: {
          status: "APPROVED", // Will be updated by webhook
        },
      });

      res.json({
        orderId,
        captureId: capture.id,
        status: capture.status,
        message: "Capture is pending",
      });
    }
  } catch (error) {
    console.error("Error capturing order:", error);
    res.status(500).json({
      error: "Failed to capture order",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /api/bets/:betId/settle
 * Settle a bet and pay out winners (admin-only)
 */
router.post("/:betId/settle", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { betId } = req.params;
    const { winners } = req.body;

    if (!Array.isArray(winners) || winners.length === 0) {
      return res.status(400).json({ error: "winners array is required with at least one user ID" });
    }

    // Verify bet exists and can be settled
    const bet = await prisma.bet.findUnique({
      where: { id: betId },
      include: {
        participants: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!bet) {
      return res.status(404).json({ error: "Bet not found" });
    }

    if (bet.status === "SETTLED") {
      return res.status(400).json({ error: "Bet is already settled" });
    }

    // Check all participants have CAPTURED status
    const uncaptured = bet.participants.filter((p) => p.status !== "CAPTURED");
    if (uncaptured.length > 0) {
      return res.status(400).json({
        error: "Cannot settle bet: some participants have not completed payment",
        uncaptured: uncaptured.map((p) => ({
          userId: p.userId,
          status: p.status,
        })),
      });
    }

    // Verify all winners are participants
    const winnerIds = new Set(winners);
    const participantIds = new Set(bet.participants.map((p) => p.userId));
    const invalidWinners = winners.filter((id: string) => !participantIds.has(id));

    if (invalidWinners.length > 0) {
      return res.status(400).json({
        error: "Some winners are not participants in this bet",
        invalidWinners,
      });
    }

    // Calculate payout per winner (equal split for now)
    const totalPoolCents = bet.participants.length * bet.stakeAmountCents;
    const payoutPerWinnerCents = Math.floor(totalPoolCents / winnerIds.size);

    // Get winner users with venmo handles
    const winnerParticipants = bet.participants.filter((p) => winnerIds.has(p.userId));

    for (const participant of winnerParticipants) {
      if (!participant.user.venmoHandle) {
        return res.status(400).json({
          error: `Winner ${participant.userId} does not have a Venmo handle`,
        });
      }

      // Validate venmo handle
      const handleValidation = validateVenmoHandle(participant.user.venmoHandle);
      if (!handleValidation.valid) {
        return res.status(400).json({
          error: `Invalid Venmo handle for user ${participant.userId}: ${handleValidation.error}`,
        });
      }
    }

    // Update bet status to SETTLED
    await prisma.bet.update({
      where: { id: betId },
      data: { status: "SETTLED" },
    });

    // Create payout records
    const payoutRecords = await Promise.all(
      winnerParticipants.map((participant) =>
        prisma.payout.create({
          data: {
            betId,
            userId: participant.userId,
            amountCents: payoutPerWinnerCents,
            status: "PENDING",
          },
        })
      )
    );

    // Create PayPal payout batch
    const settleAttempt = Date.now(); // Simple attempt counter
    const payoutItems = payoutRecords.map((payout, index) => ({
      recipient_type: "USER_HANDLE",
      amount: {
        value: (payout.amountCents / 100).toFixed(2),
        currency: "USD",
      },
      receiver: winnerParticipants[index].user.venmoHandle?.replace(/^@/, ""), // Remove @ if present
      sender_item_id: `${betId}:${settleAttempt}:${payout.userId}`,
      note: `Bet payout: ${bet.title}`,
    }));

    const payoutBatch = await paypalRequest<{
      batch_header: {
        payout_batch_id: string;
        batch_status: string;
      };
    }>("POST", "/v1/payments/payouts", {
      sender_batch_header: {
        sender_batch_id: `${betId}:${settleAttempt}`,
        email_subject: "You have a payout from BetOnEm",
        email_message: `You won a bet: ${bet.title}. Amount: $${(payoutPerWinnerCents / 100).toFixed(2)}`,
      },
      items: payoutItems,
    });

    const batchId = payoutBatch.batch_header.payout_batch_id;

    // Update payout records with batch ID
    await Promise.all(
      payoutRecords.map((payout, index) =>
        prisma.payout.update({
          where: { id: payout.id },
          data: {
            batchId,
            // Item ID will be updated from webhook
          },
        })
      )
    );

    res.json({
      batchId,
      status: payoutBatch.batch_header.batch_status,
      payouts: payoutRecords.map((p) => ({
        id: p.id,
        userId: p.userId,
        amountCents: p.amountCents,
        status: p.status,
      })),
    });
  } catch (error) {
    console.error("Error settling bet:", error);
    res.status(500).json({
      error: "Failed to settle bet and create payouts",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/bets/:betId
 * Get bet details
 */
router.get("/:betId", async (req: Request, res: Response) => {
  try {
    const { betId } = req.params;

    const bet = await prisma.bet.findUnique({
      where: { id: betId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                venmoHandle: true,
              },
            },
          },
        },
      },
    });

    if (!bet) {
      return res.status(404).json({ error: "Bet not found" });
    }

    res.json({
      id: bet.id,
      title: bet.title,
      stakeAmount: bet.stakeAmountCents / 100,
      stakeAmountCents: bet.stakeAmountCents,
      status: bet.status,
      endsAt: bet.endsAt.toISOString(),
      createdAt: bet.createdAt.toISOString(),
      participants: bet.participants.map((p) => ({
        userId: p.userId,
        status: p.status,
        orderId: p.orderId,
        captureId: p.captureId,
        user: p.user,
      })),
    });
  } catch (error) {
    console.error("Error fetching bet:", error);
    res.status(500).json({ error: "Failed to fetch bet" });
  }
});

export default router;
