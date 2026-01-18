# BetOnEm Backend Server

Express backend with PayPal integration for the friends betting app.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in the project root (or add to `.env.local`):

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/betonem?schema=public"

# PayPal Sandbox (for development)
PAYPAL_CLIENT_ID="your_sandbox_client_id"
PAYPAL_CLIENT_SECRET="your_sandbox_client_secret"
PAYPAL_BASE_URL="https://api-m.sandbox.paypal.com"
PAYPAL_WEBHOOK_ID="your_webhook_id"  # Get this after creating webhook in PayPal dashboard

# App Configuration
APP_URL="http://localhost:3000"  # Frontend URL for PayPal return URLs
PORT=3001  # Backend server port
NODE_ENV="development"
```

**Getting PayPal Sandbox Credentials:**
1. Go to [PayPal Developer Dashboard](https://developer.paypal.com/)
2. Log in with your PayPal account
3. Go to **Apps & Credentials**
4. Create a new app or use default sandbox app
5. Copy **Client ID** and **Secret**

### 3. Database Setup

#### Option A: Use Prisma Migrate (Recommended)

```bash
# Generate Prisma Client
npm run db:generate

# Create and run migration
npm run db:migrate
```

#### Option B: Push Schema Directly (Development Only)

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push
```

### 4. Seed Initial Data (Optional)

Create a test user:

```sql
INSERT INTO users (id, email, venmo_handle) 
VALUES ('test-user-id', 'test@example.com', 'testuser')
ON CONFLICT (id) DO NOTHING;
```

## Running the Server

### Development (with hot reload)

```bash
npm run dev:server
```

Server will run on `http://localhost:3001`

### Production

```bash
# Build TypeScript
tsc --project tsconfig.server.json

# Run compiled code
npm run start:server
```

## PayPal Webhook Setup

### 1. Install ngrok (for local testing)

```bash
# macOS
brew install ngrok

# Or download from https://ngrok.com/download
```

### 2. Start ngrok tunnel

```bash
ngrok http 3001
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

### 3. Create Webhook in PayPal Dashboard

1. Go to [PayPal Developer Dashboard](https://developer.paypal.com/)
2. Navigate to **My Apps & Credentials** → Your Sandbox App
3. Scroll to **Webhooks** section
4. Click **Add Webhook**
5. Enter webhook URL: `https://your-ngrok-url.ngrok.io/api/paypal/webhook`
6. Select these event types:
   - `CHECKOUT.ORDER.APPROVED`
   - `PAYMENT.CAPTURE.COMPLETED`
   - `PAYMENT.CAPTURE.DENIED`
   - `PAYMENT.CAPTURE.REFUNDED`
   - `PAYMENT.PAYOUTS-ITEM.SUCCESS`
   - `PAYMENT.PAYOUTS-ITEM.DENIED`
   - `PAYMENT.PAYOUTS-ITEM.FAILED`
7. Copy the **Webhook ID** and add it to your `.env` as `PAYPAL_WEBHOOK_ID`

### 4. Verify Webhook (Optional)

PayPal will send a `VERIFY_WEBHOOK_SIGNATURE` event. Your handler will verify signatures automatically.

## API Endpoints

### Bets

#### `POST /api/bets`
Create a new bet.

**Headers:**
- `X-User-Id: <user-id>` (stub auth)

**Body:**
```json
{
  "title": "Will it rain tomorrow?",
  "stakeAmount": 10.00,
  "endsAt": "2024-12-31T23:59:59Z"
}
```

**Response:**
```json
{
  "id": "bet-uuid",
  "title": "Will it rain tomorrow?",
  "stakeAmount": 10,
  "stakeAmountCents": 1000,
  "status": "OPEN",
  "endsAt": "2024-12-31T23:59:59.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

#### `POST /api/bets/:betId/join`
Join a bet and create PayPal order.

**Headers:**
- `X-User-Id: <user-id>`

**Response:**
```json
{
  "orderId": "5O190127TN364715T",
  "approveUrl": "https://www.sandbox.paypal.com/checkoutnow?token=...",
  "status": "CREATED"
}
```

#### `POST /api/bets/:betId/capture`
Capture a PayPal order after approval.

**Headers:**
- `X-User-Id: <user-id>`

**Body:**
```json
{
  "orderId": "5O190127TN364715T"
}
```

**Response:**
```json
{
  "orderId": "5O190127TN364715T",
  "captureId": "3C679077H9080930S",
  "status": "CAPTURED"
}
```

#### `POST /api/bets/:betId/settle`
Settle a bet and create payouts (admin-only).

**Headers:**
- `X-User-Id: <user-id>`
- `X-Is-Admin: true`

**Body:**
```json
{
  "winners": ["user-id-1", "user-id-2"]
}
```

**Response:**
```json
{
  "batchId": "C6XMN83KR28WC",
  "status": "PENDING",
  "payouts": [...]
}
```

#### `GET /api/bets/:betId`
Get bet details.

**Headers:**
- `X-User-Id: <user-id>`

### Payouts

#### `GET /api/payouts/:batchId`
Get payout batch status.

**Headers:**
- `X-User-Id: <user-id>`

### Webhooks

#### `POST /api/paypal/webhook`
PayPal webhook endpoint (no auth, uses signature verification).

## Testing with cURL

### 1. Create a Bet

```bash
curl -X POST http://localhost:3001/api/bets \
  -H "Content-Type: application/json" \
  -H "X-User-Id: test-user-id" \
  -d '{
    "title": "Will it rain tomorrow?",
    "stakeAmount": 10.00,
    "endsAt": "2024-12-31T23:59:59Z"
  }'
```

Save the `id` from response as `BET_ID`.

### 2. Join Bet (Create PayPal Order)

```bash
curl -X POST http://localhost:3001/api/bets/$BET_ID/join \
  -H "Content-Type: application/json" \
  -H "X-User-Id: test-user-id"
```

Copy the `approveUrl` and open it in a browser. Approve the payment in PayPal sandbox.

### 3. Capture Order

```bash
curl -X POST http://localhost:3001/api/bets/$BET_ID/capture \
  -H "Content-Type: application/json" \
  -H "X-User-Id: test-user-id" \
  -d '{
    "orderId": "ORDER_ID_FROM_STEP_2"
  }'
```

### 4. Settle Bet (Admin)

```bash
curl -X POST http://localhost:3001/api/bets/$BET_ID/settle \
  -H "Content-Type: application/json" \
  -H "X-User-Id: admin-user-id" \
  -H "X-Is-Admin: true" \
  -d '{
    "winners": ["test-user-id"]
  }'
```

Save the `batchId` from response.

### 5. Check Payout Status

```bash
curl -X GET http://localhost:3001/api/payouts/$BATCH_ID \
  -H "X-User-Id: admin-user-id"
```

## PayPal Sandbox Gotchas

### Buyer vs Seller Accounts

In PayPal sandbox, you need TWO types of accounts:

1. **Personal Account (Buyer)** - For testing payments/orders
   - Use the default sandbox personal account from PayPal dashboard
   - Or create one: **Accounts** → **Create account** → Select **Personal**

2. **Business Account (Seller)** - For receiving payments and sending payouts
   - Your app credentials are linked to a business account
   - Ensure this account has sufficient balance for payouts

### Testing Payouts to Venmo

- Payouts to Venmo handles (`recipient_type: USER_HANDLE`) work in sandbox
- Use sandbox Venmo handles (test accounts)
- Real Venmo handles won't work in sandbox

### Common Issues

1. **"INSUFFICIENT_FUNDS"** - Ensure your PayPal sandbox business account has funds
2. **Webhook not received** - Check ngrok is running and URL is correct
3. **Invalid signature** - Ensure `PAYPAL_WEBHOOK_ID` matches the webhook in dashboard
4. **Token expiry** - Access tokens are cached and auto-refreshed

## Security Notes

- Access tokens are cached and automatically refreshed
- Sensitive data (tokens, secrets) is NOT logged in error messages
- Webhook signatures are verified before processing
- All monetary amounts stored as cents (integers) to avoid floating-point errors

## Production Checklist

Before going live:

- [ ] Switch `PAYPAL_BASE_URL` to `https://api-m.paypal.com`
- [ ] Update PayPal credentials to production app
- [ ] Set up production webhook with real domain
- [ ] Implement proper authentication (JWT, sessions, etc.)
- [ ] Set up proper admin authorization
- [ ] Enable HTTPS for webhook endpoint
- [ ] Set up database backups
- [ ] Configure proper logging/monitoring
- [ ] Test payout flow end-to-end with real accounts (small amounts)
