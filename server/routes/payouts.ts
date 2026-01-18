/**
 * Payout Routes
 */

import { Router, Request, Response } from "express";
import { prisma } from "../lib/db";
import { paypalRequest } from "../lib/paypal/client";

const router = Router();

/**
 * GET /api/payouts/:batchId
 * Get payout batch status from PayPal and update database
 */
router.get("/:batchId", async (req: Request, res: Response) => {
  try {
    const { batchId } = req.params;

    // Fetch from PayPal
    const batch = await paypalRequest<{
      batch_header: {
        payout_batch_id: string;
        batch_status: string;
        sender_batch_id: string;
      };
      items: Array<{
        payout_item_id: string;
        transaction_status: string;
        payout_item_fee?: {
          value: string;
          currency: string;
        };
        payout_batch_id: string;
        payout_item: {
          receiver: string;
          amount: {
            value: string;
            currency: string;
          };
          sender_item_id: string;
        };
      }>;
    }>("GET", `/v1/payments/payouts/${batchId}`);

    // Update local database with latest statuses
    if (batch.items) {
      for (const item of batch.items) {
        const senderItemId = item.payout_item?.sender_item_id;
        if (senderItemId) {
          // Parse sender_item_id: betId:settleAttempt:userId
          const parts = senderItemId.split(":");
          if (parts.length >= 3) {
            const userId = parts[2];

            let payoutStatus: "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED" | "DENIED" = "PENDING";

            switch (item.transaction_status) {
              case "SUCCESS":
                payoutStatus = "SUCCESS";
                break;
              case "DENIED":
                payoutStatus = "DENIED";
                break;
              case "FAILED":
                payoutStatus = "FAILED";
                break;
              case "PENDING":
              case "PROCESSING":
              case "UNCLAIMED":
                payoutStatus = "PROCESSING";
                break;
            }

            await prisma.payout.updateMany({
              where: {
                batchId,
                userId,
                itemId: item.payout_item_id,
              },
              data: {
                status: payoutStatus,
                itemId: item.payout_item_id,
              },
            });
          }
        }
      }
    }

    // Get local payout records
    const payouts = await prisma.payout.findMany({
      where: { batchId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            venmoHandle: true,
          },
        },
        bet: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    res.json({
      batchId: batch.batch_header.payout_batch_id,
      status: batch.batch_header.batch_status,
      payouts: payouts.map((p) => ({
        id: p.id,
        userId: p.userId,
        user: p.user,
        amountCents: p.amountCents,
        amount: p.amountCents / 100,
        status: p.status,
        itemId: p.itemId,
        bet: p.bet,
      })),
    });
  } catch (error) {
    console.error("Error fetching payout batch:", error);
    res.status(500).json({
      error: "Failed to fetch payout batch",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
