/**
 * PayPal Webhook Handler
 */

import { Router, Request, Response } from "express";
import { prisma } from "../lib/db";
import { verifyWebhookSignature, getWebhookEventType } from "../lib/paypal/webhook";

const router = Router();

// PayPal webhook endpoint
router.post("/webhook", async (req: Request, res: Response) => {
  // Get raw body for signature verification (stored by express.json verify)
  const rawBody = (req as any).rawBody || JSON.stringify(req.body);

  // Verify webhook signature
  const isValid = await verifyWebhookSignature(req.headers, rawBody);

  if (!isValid) {
    console.error("Invalid webhook signature");
    return res.status(401).json({ error: "Invalid webhook signature" });
  }

  const eventType = getWebhookEventType(req.body);

  console.log(`Received PayPal webhook: ${eventType}`);

  try {
    // Handle different webhook event types
    if (eventType === "CHECKOUT.ORDER.APPROVED") {
      await handleOrderApproved(req.body);
    } else if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
      await handleCaptureCompleted(req.body);
    } else if (eventType === "PAYMENT.CAPTURE.DENIED" || eventType === "PAYMENT.CAPTURE.REFUNDED") {
      await handleCaptureFailed(req.body);
    } else if (eventType === "PAYMENT.PAYOUTS-ITEM.SUCCESS") {
      await handlePayoutSuccess(req.body);
    } else if (eventType === "PAYMENT.PAYOUTS-ITEM.DENIED" || eventType === "PAYMENT.PAYOUTS-ITEM.FAILED") {
      await handlePayoutFailed(req.body);
    } else {
      console.log(`Unhandled webhook event type: ${eventType}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    // Still return 200 to prevent PayPal retries for transient errors
    // Log the error for manual review
    res.status(200).json({ received: true, error: "Processing failed but acknowledged" });
  }
});

/**
 * Handle CHECKOUT.ORDER.APPROVED
 */
async function handleOrderApproved(body: unknown): Promise<void> {
  if (
    typeof body === "object" &&
    body !== null &&
    "resource" in body &&
    typeof body.resource === "object" &&
    body.resource !== null &&
    "id" in body.resource
  ) {
    const orderId = String(body.resource.id);

    await prisma.betParticipant.updateMany({
      where: { orderId },
      data: { status: "APPROVED" },
    });
  }
}

/**
 * Handle PAYMENT.CAPTURE.COMPLETED
 */
async function handleCaptureCompleted(body: unknown): Promise<void> {
  if (
    typeof body === "object" &&
    body !== null &&
    "resource" in body &&
    typeof body.resource === "object" &&
    body.resource !== null &&
    "id" in body.resource &&
    "custom_id" in body.resource
  ) {
    const captureId = String(body.resource.id);
    const customId = String(body.resource.custom_id);

    // Extract order ID from resource
    const orderId =
      body.resource &&
      typeof body.resource === "object" &&
      "supplementary_data" in body.resource &&
      body.resource.supplementary_data &&
      typeof body.resource.supplementary_data === "object" &&
      "related_ids" in body.resource.supplementary_data &&
      body.resource.supplementary_data.related_ids &&
      typeof body.resource.supplementary_data.related_ids === "object" &&
      "order_id" in body.resource.supplementary_data.related_ids
        ? String(body.resource.supplementary_data.related_ids.order_id)
        : null;

    if (orderId) {
      await prisma.betParticipant.updateMany({
        where: { orderId },
        data: {
          status: "CAPTURED",
          captureId,
        },
      });
    }
  }
}

/**
 * Handle PAYMENT.CAPTURE.DENIED or REFUNDED
 */
async function handleCaptureFailed(body: unknown): Promise<void> {
  if (
    typeof body === "object" &&
    body !== null &&
    "resource" in body &&
    typeof body.resource === "object" &&
    body.resource !== null
  ) {
    // Extract order ID from resource
    const orderId =
      body.resource &&
      typeof body.resource === "object" &&
      "supplementary_data" in body.resource &&
      body.resource.supplementary_data &&
      typeof body.resource.supplementary_data === "object" &&
      "related_ids" in body.resource.supplementary_data &&
      body.resource.supplementary_data.related_ids &&
      typeof body.resource.supplementary_data.related_ids === "object" &&
      "order_id" in body.resource.supplementary_data.related_ids
        ? String(body.resource.supplementary_data.related_ids.order_id)
        : null;

    if (orderId) {
      await prisma.betParticipant.updateMany({
        where: { orderId },
        data: { status: "FAILED" },
      });
    }
  }
}

/**
 * Handle PAYMENT.PAYOUTS-ITEM.SUCCESS
 */
async function handlePayoutSuccess(body: unknown): Promise<void> {
  if (
    typeof body === "object" &&
    body !== null &&
    "resource" in body &&
    typeof body.resource === "object" &&
    body.resource !== null &&
    "payout_item_id" in body.resource &&
    "payout_batch_id" in body.resource
  ) {
    const itemId = String(body.resource.payout_item_id);
    const batchId = String(body.resource.payout_batch_id);

    await prisma.payout.updateMany({
      where: { batchId, itemId: null }, // Update by batch, matching itemId will be set
      data: {
        itemId,
        status: "SUCCESS",
      },
    });

    // Also update if itemId already exists
    await prisma.payout.updateMany({
      where: { itemId },
      data: { status: "SUCCESS" },
    });
  }
}

/**
 * Handle PAYMENT.PAYOUTS-ITEM.DENIED or FAILED
 */
async function handlePayoutFailed(body: unknown): Promise<void> {
  if (
    typeof body === "object" &&
    body !== null &&
    "resource" in body &&
    typeof body.resource === "object" &&
    body.resource !== null &&
    "payout_item_id" in body.resource
  ) {
    const itemId = String(body.resource.payout_item_id);
    const eventType = getWebhookEventType(body);
    const status = eventType?.includes("DENIED") ? "DENIED" : "FAILED";

    await prisma.payout.updateMany({
      where: { itemId },
      data: { status },
    });
  }
}

export default router;
