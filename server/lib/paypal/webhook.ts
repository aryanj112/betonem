/**
 * PayPal Webhook Verification
 */

import { paypalRequest } from "./client";
import crypto from "crypto";

const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID;

/**
 * Verify webhook signature using PayPal's verification API
 * https://developer.paypal.com/docs/api-basics/notifications/webhooks/notification-messages/#verify-webhook-signature
 */
export async function verifyWebhookSignature(
  headers: Record<string, string | string[] | undefined>,
  body: string
): Promise<boolean> {
  if (!PAYPAL_WEBHOOK_ID) {
    console.warn("PAYPAL_WEBHOOK_ID not set, skipping webhook verification");
    return true; // Allow in dev if webhook ID not configured
  }

  const authAlgo = headers["paypal-auth-algo"] as string;
  const certUrl = headers["paypal-cert-url"] as string;
  const transmissionId = headers["paypal-transmission-id"] as string;
  const transmissionSig = headers["paypal-transmission-sig"] as string;
  const transmissionTime = headers["paypal-transmission-time"] as string;

  if (!authAlgo || !certUrl || !transmissionId || !transmissionSig || !transmissionTime) {
    console.error("Missing PayPal webhook signature headers");
    return false;
  }

  try {
    const verificationResponse = await paypalRequest<{
      verification_status: string;
    }>("POST", "/v1/notifications/verify-webhook-signature", {
      auth_algo: authAlgo,
      cert_url: certUrl,
      transmission_id: transmissionId,
      transmission_sig: transmissionSig,
      transmission_time: transmissionTime,
      webhook_id: PAYPAL_WEBHOOK_ID,
      webhook_event: JSON.parse(body),
    });

    return verificationResponse.verification_status === "SUCCESS";
  } catch (error) {
    console.error("Webhook verification failed:", error instanceof Error ? error.message : error);
    return false;
  }
}

/**
 * Get webhook event type from payload
 */
export function getWebhookEventType(body: unknown): string | null {
  if (typeof body === "object" && body !== null && "event_type" in body) {
    return String(body.event_type);
  }
  return null;
}
