# API Reference

Complete API reference for BetOnEm PayPal backend.

## Base URL

- Development: `http://localhost:3001`
- Production: Your backend domain

## Authentication (Stub)

All endpoints except webhooks require authentication headers:

- `X-User-Id: <user-id>` - User identifier
- `X-Is-Admin: true` - Admin flag (for admin endpoints)

**Note:** Replace with proper JWT/OAuth in production.

---

## Endpoints

### Health Check

#### `GET /health`

Check server status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### Bets

#### `POST /api/bets`

Create a new bet.

**Headers:**
- `X-User-Id: <user-id>`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "title": "Will it rain tomorrow?",
  "stakeAmount": 10.00,
  "participantsCount": 5,
  "endsAt": "2024-12-31T23:59:59Z"
}
```

**Response (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Will it rain tomorrow?",
  "stakeAmount": 10,
  "stakeAmountCents": 1000,
  "status": "OPEN",
  "endsAt": "2024-12-31T23:59:59.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Errors:**
- `400` - Invalid input (missing title, invalid amount, etc.)
- `500` - Server error

---

#### `POST /api/bets/:betId/join`

Join a bet and create PayPal checkout order.

**Headers:**
- `X-User-Id: <user-id>`

**Response (201):**
```json
{
  "orderId": "5O190127TN364715T",
  "approveUrl": "https://www.sandbox.paypal.com/checkoutnow?token=...",
  "status": "CREATED"
}
```

**Flow:**
1. Client receives `approveUrl`
2. Redirect user to `approveUrl`
3. User approves payment in PayPal
4. PayPal redirects to `return_url` (from order creation)
5. Client calls `/api/bets/:betId/capture` with `orderId`

**Errors:**
- `404` - Bet not found
- `400` - Bet is not OPEN, user already joined, or missing Venmo handle
- `500` - Server/PayPal error

---

#### `POST /api/bets/:betId/capture`

Capture a PayPal order after user approval. Idempotent.

**Headers:**
- `X-User-Id: <user-id>`

**Request Body:**
```json
{
  "orderId": "5O190127TN364715T"
}
```

**Response (200):**
```json
{
  "orderId": "5O190127TN364715T",
  "captureId": "3C679077H9080930S",
  "status": "CAPTURED"
}
```

**Idempotent:** If order is already captured, returns existing capture info.

**Errors:**
- `404` - Participant/order not found
- `500` - PayPal capture failed

---

#### `POST /api/bets/:betId/settle` (Admin)

Settle a bet and create payouts to winners.

**Headers:**
- `X-User-Id: <user-id>`
- `X-Is-Admin: true`

**Request Body:**
```json
{
  "winners": ["user-id-1", "user-id-2"]
}
```

**Response (200):**
```json
{
  "batchId": "C6XMN83KR28WC",
  "status": "PENDING",
  "payouts": [
    {
      "id": "payout-uuid-1",
      "userId": "user-id-1",
      "amountCents": 2500,
      "status": "PENDING"
    }
  ]
}
```

**Business Logic:**
- Verifies all participants have `CAPTURED` status
- Verifies all winners are participants
- Calculates equal split: `totalPool / winners.length`
- Creates PayPal payout batch with Venmo handles
- Updates bet status to `SETTLED`

**Errors:**
- `404` - Bet not found
- `400` - Bet already settled, uncaptured participants, invalid winners, missing Venmo handles
- `403` - Not admin
- `500` - Payout creation failed

---

#### `GET /api/bets/:betId`

Get bet details with participants.

**Headers:**
- `X-User-Id: <user-id>`

**Response (200):**
```json
{
  "id": "bet-uuid",
  "title": "Will it rain tomorrow?",
  "stakeAmount": 10,
  "stakeAmountCents": 1000,
  "status": "OPEN",
  "endsAt": "2024-12-31T23:59:59.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "participants": [
    {
      "userId": "user-id-1",
      "status": "CAPTURED",
      "orderId": "5O190127TN364715T",
      "captureId": "3C679077H9080930S",
      "user": {
        "id": "user-id-1",
        "email": "user@example.com",
        "venmoHandle": "@user1"
      }
    }
  ]
}
```

---

### Payouts

#### `GET /api/payouts/:batchId`

Get payout batch status from PayPal and update local database.

**Headers:**
- `X-User-Id: <user-id>`

**Response (200):**
```json
{
  "batchId": "C6XMN83KR28WC",
  "status": "SUCCESS",
  "payouts": [
    {
      "id": "payout-uuid",
      "userId": "user-id-1",
      "user": {
        "id": "user-id-1",
        "email": "user@example.com",
        "venmoHandle": "@user1"
      },
      "amountCents": 2500,
      "amount": 25.00,
      "status": "SUCCESS",
      "itemId": "WHLRKZ4GZJLXY",
      "bet": {
        "id": "bet-uuid",
        "title": "Will it rain tomorrow?"
      }
    }
  ]
}
```

**Note:** This endpoint fetches latest status from PayPal and updates the local database.

---

### Webhooks

#### `POST /api/paypal/webhook`

PayPal webhook endpoint. No authentication (uses signature verification).

**Handled Events:**
- `CHECKOUT.ORDER.APPROVED` - Updates participant status to `APPROVED`
- `PAYMENT.CAPTURE.COMPLETED` - Updates participant status to `CAPTURED`
- `PAYMENT.CAPTURE.DENIED` / `REFUNDED` - Updates participant status to `FAILED`
- `PAYMENT.PAYOUTS-ITEM.SUCCESS` - Updates payout status to `SUCCESS`
- `PAYMENT.PAYOUTS-ITEM.DENIED` / `FAILED` - Updates payout status accordingly

**Response:** Always `200` (to prevent retries)

---

## Data Models

### Bet Status

- `OPEN` - Accepting participants
- `LOCKED` - Not used currently (can be set manually)
- `SETTLED` - Settled, payouts created

### BetParticipant Status

- `CREATED` - Order created, not yet approved
- `APPROVED` - Order approved by user, capture pending
- `CAPTURED` - Payment captured successfully
- `FAILED` - Capture denied/refunded

### Payout Status

- `PENDING` - Created, not yet processed
- `PROCESSING` - PayPal is processing
- `SUCCESS` - Payout completed
- `FAILED` - Payout failed
- `DENIED` - Payout denied

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message",
  "message": "Additional details (development only)"
}
```

**HTTP Status Codes:**
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid auth)
- `403` - Forbidden (admin required)
- `404` - Not Found
- `500` - Internal Server Error

---

## Idempotency

These endpoints are idempotent:

- `POST /api/bets/:betId/capture` - Multiple calls with same `orderId` return same result
- Payout creation uses `sender_batch_id` and `sender_item_id` for idempotency

---

## Currency Handling

All monetary amounts are handled as **cents (integers)** to avoid floating-point errors:

- `stakeAmount: 10.00` → `stakeAmountCents: 1000`
- `amountCents: 2500` → Display as `$25.00`
