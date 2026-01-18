# PayPal Integration Test Plan

Complete test plan for verifying PayPal Orders and Payouts functionality.

---

## Prerequisites

### 1. Environment Setup

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Ensure database is migrated
npm run db:migrate
```

### 2. Environment Variables

Ensure `.env` file contains:

```env
DATABASE_URL="postgresql://..."
PAYPAL_CLIENT_ID="your_sandbox_client_id"
PAYPAL_CLIENT_SECRET="your_sandbox_client_secret"
PAYPAL_BASE_URL="https://api-m.sandbox.paypal.com"
PAYPAL_WEBHOOK_ID="your_webhook_id"  # Can be empty for initial tests
APP_URL="http://localhost:3000"
PORT=3001
```

### 3. PayPal Sandbox Accounts

**Required accounts:**
- **Business Account** (Seller) - Receives payments
  - Login: PayPal Developer Dashboard → Sandbox → Accounts
  - This account receives payments from buyers
  
- **Personal Account** (Buyer) - Makes payments
  - Create one: Sandbox → Accounts → Create Account → Personal
  - Use this to approve payments

**Tip:** Use PayPal Developer Dashboard to manage sandbox accounts.

### 4. Test User Data

Create a test user in your database:

```sql
INSERT INTO users (id, email, venmo_handle) 
VALUES ('test-user-123', 'buyer@test.com', 'testbuyer')
ON CONFLICT (id) DO NOTHING;

-- Create admin user
INSERT INTO users (id, email, venmo_handle) 
VALUES ('admin-user-456', 'admin@test.com', 'testadmin')
ON CONFLICT (id) DO NOTHING;
```

---

## Test Scenarios

### Test 1: Create a Bet

**Objective:** Verify bet creation works.

**Steps:**
```bash
curl -X POST http://localhost:3001/api/bets \
  -H "Content-Type: application/json" \
  -H "X-User-Id: test-user-123" \
  -d '{
    "title": "Will it rain tomorrow?",
    "stakeAmount": 10.00,
    "endsAt": "2024-12-31T23:59:59Z"
  }'
```

**Expected Result:**
- Status: `201 Created`
- Response contains `id`, `title`, `stakeAmount`, `status: "OPEN"`
- Save the `id` as `BET_ID` for next tests

**Validation:**
- Check database: `SELECT * FROM bets WHERE id = 'BET_ID';`
- Status should be `OPEN`
- `stake_amount_cents` should be `1000` (10.00 * 100)

---

### Test 2: Join Bet (Create PayPal Order)

**Objective:** Verify PayPal order creation and participant record.

**Steps:**
```bash
curl -X POST http://localhost:3001/api/bets/$BET_ID/join \
  -H "Content-Type: application/json" \
  -H "X-User-Id: test-user-123"
```

**Expected Result:**
- Status: `201 Created`
- Response contains:
  - `orderId` (PayPal order ID, e.g., `5O190127TN364715T`)
  - `approveUrl` (PayPal checkout URL)
  - `status: "CREATED"`

**Validation:**
1. **Database Check:**
   ```sql
   SELECT * FROM bet_participants WHERE bet_id = 'BET_ID' AND user_id = 'test-user-123';
   ```
   - Should exist with `status = 'CREATED'`
   - `order_id` should match response

2. **PayPal Check:**
   - Copy `approveUrl` from response
   - Open in browser (should redirect to PayPal sandbox)
   - Don't approve yet (use Test 3)

---

### Test 3: Approve Payment (Manual)

**Objective:** Verify user can approve payment in PayPal.

**Steps:**
1. Open `approveUrl` from Test 2 in browser
2. Login with PayPal sandbox **Personal Account** (buyer)
3. Approve the payment
4. PayPal redirects to `return_url` (may fail locally, that's OK)

**Expected Result:**
- PayPal login page appears
- Payment approval page shows $10.00
- After approval, redirects to your return URL

**Validation:**
- Check PayPal Developer Dashboard → Transactions
- Order should show status: `CREATED` or `APPROVED`

---

### Test 4: Capture Order

**Objective:** Verify order capture updates participant status.

**Prerequisites:** Order must be approved (Test 3)

**Steps:**
```bash
# Use orderId from Test 2
curl -X POST http://localhost:3001/api/bets/$BET_ID/capture \
  -H "Content-Type: application/json" \
  -H "X-User-Id: test-user-123" \
  -d '{
    "orderId": "ORDER_ID_FROM_TEST_2"
  }'
```

**Expected Result:**
- Status: `200 OK`
- Response contains:
  - `orderId`
  - `captureId` (e.g., `3C679077H9080930S`)
  - `status: "CAPTURED"`

**Validation:**
1. **Database Check:**
   ```sql
   SELECT * FROM bet_participants WHERE order_id = 'ORDER_ID';
   ```
   - `status` should be `CAPTURED`
   - `capture_id` should match response

2. **PayPal Check:**
   - Developer Dashboard → Transactions
   - Order status should be `COMPLETED`
   - Capture should show `COMPLETED`

**Idempotency Test:**
- Run same `capture` command again
- Should return same result (status `200`, same `captureId`)
- Database should remain unchanged

---

### Test 5: Join Bet with Another User

**Objective:** Verify multiple participants can join.

**Steps:**
```bash
# Create second user first
# (or use existing user with different ID)

curl -X POST http://localhost:3001/api/bets/$BET_ID/join \
  -H "Content-Type: application/json" \
  -H "X-User-Id: test-user-789"
```

**Expected Result:**
- Status: `201 Created`
- New order created for second user

**Repeat Tests 3-4** for this user to capture payment.

---

### Test 6: Settle Bet (Admin)

**Objective:** Verify bet settlement and payout creation.

**Prerequisites:** 
- At least 2 participants with `CAPTURED` status
- Admin user must exist

**Steps:**
```bash
curl -X POST http://localhost:3001/api/bets/$BET_ID/settle \
  -H "Content-Type: application/json" \
  -H "X-User-Id: admin-user-456" \
  -H "X-Is-Admin: true" \
  -d '{
    "winners": ["test-user-123"]
  }'
```

**Expected Result:**
- Status: `200 OK`
- Response contains:
  - `batchId` (PayPal payout batch ID)
  - `status: "PENDING"`
  - `payouts` array with payout records

**Validation:**
1. **Database Check:**
   ```sql
   -- Bet should be SETTLED
   SELECT status FROM bets WHERE id = 'BET_ID';
   -- Should be 'SETTLED'
   
   -- Payouts should exist
   SELECT * FROM payouts WHERE bet_id = 'BET_ID';
   -- Should have payout for test-user-123
   -- batch_id should match response
   -- status should be 'PENDING'
   ```

2. **PayPal Check:**
   - Developer Dashboard → Payments → Payouts
   - Find batch by `batchId`
   - Status should be `PENDING` or `PROCESSING`

**Payout Calculation:**
- If 2 participants paid $10 each = $20 total
- 1 winner → gets $20 (100% of pool)
- Verify: `amount_cents = 2000` ($20.00)

---

### Test 7: Check Payout Status

**Objective:** Verify payout status fetching.

**Steps:**
```bash
# Use batchId from Test 6
curl -X GET http://localhost:3001/api/payouts/$BATCH_ID \
  -H "X-User-Id: admin-user-456"
```

**Expected Result:**
- Status: `200 OK`
- Response contains:
  - `batchId`
  - `status` (from PayPal)
  - `payouts` array with updated statuses

**Validation:**
- Database should be updated with latest PayPal statuses
- Status may be `PENDING`, `PROCESSING`, `SUCCESS`, etc.

**Note:** In sandbox, payouts to Venmo handles may take time or not complete. Check PayPal dashboard for actual status.

---

## Webhook Testing (Optional but Recommended)

### Test 8: Webhook Setup

**Objective:** Verify webhook receives PayPal events.

**Prerequisites:**
- Install ngrok: `brew install ngrok` (macOS) or download from ngrok.com
- Running server: `npm run dev:server`

**Steps:**

1. **Start ngrok:**
   ```bash
   ngrok http 3001
   ```
   Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

2. **Create webhook in PayPal:**
   - Go to Developer Dashboard → Your App → Webhooks
   - Add webhook URL: `https://your-ngrok-url.ngrok.io/api/paypal/webhook`
   - Select events:
     - `CHECKOUT.ORDER.APPROVED`
     - `PAYMENT.CAPTURE.COMPLETED`
     - `PAYMENT.CAPTURE.DENIED`
     - `PAYMENT.PAYOUTS-ITEM.SUCCESS`
   - Copy **Webhook ID** and add to `.env` as `PAYPAL_WEBHOOK_ID`

3. **Test webhook:**
   - In PayPal webhook settings, click "Send test event"
   - Check server logs for webhook received

**Validation:**
- Server logs show: `Received PayPal webhook: <event_type>`
- Database updates automatically based on webhook events

---

## Error Scenario Tests

### Test 9: Join Already-Joined Bet

**Steps:**
```bash
# Try joining same bet twice with same user
curl -X POST http://localhost:3001/api/bets/$BET_ID/join \
  -H "X-User-Id: test-user-123"
```

**Expected Result:**
- Status: `400 Bad Request`
- Error: `"You have already joined this bet"`

---

### Test 10: Join Closed Bet

**Steps:**
1. Create bet and manually set status to `LOCKED` or `SETTLED`
2. Try joining:

```bash
curl -X POST http://localhost:3001/api/bets/$BET_ID/join \
  -H "X-User-Id: new-user-id"
```

**Expected Result:**
- Status: `400 Bad Request`
- Error: `"Bet is LOCKED, cannot join"` or `"Bet is SETTLED, cannot join"`

---

### Test 11: Settle with Uncaptured Participants

**Steps:**
1. Create bet with participant (status `CREATED` or `APPROVED`, not `CAPTURED`)
2. Try settling:

```bash
curl -X POST http://localhost:3001/api/bets/$BET_ID/settle \
  -H "X-User-Id: admin-user-456" \
  -H "X-Is-Admin: true" \
  -d '{"winners": ["test-user-123"]}'
```

**Expected Result:**
- Status: `400 Bad Request`
- Error: `"Cannot settle bet: some participants have not completed payment"`
- Response includes `uncaptured` array

---

### Test 12: Settle with Invalid Winners

**Steps:**
```bash
curl -X POST http://localhost:3001/api/bets/$BET_ID/settle \
  -H "X-User-Id: admin-user-456" \
  -H "X-Is-Admin: true" \
  -d '{
    "winners": ["non-existent-user-id"]
  }'
```

**Expected Result:**
- Status: `400 Bad Request`
- Error: `"Some winners are not participants in this bet"`

---

### Test 13: Settle Without Admin

**Steps:**
```bash
curl -X POST http://localhost:3001/api/bets/$BET_ID/settle \
  -H "X-User-Id: test-user-123" \
  # No X-Is-Admin header
  -d '{"winners": ["test-user-123"]}'
```

**Expected Result:**
- Status: `403 Forbidden`
- Error: `"Forbidden: Admin access required"`

---

### Test 14: Capture Invalid Order

**Steps:**
```bash
curl -X POST http://localhost:3001/api/bets/$BET_ID/capture \
  -H "X-User-Id: test-user-123" \
  -d '{"orderId": "INVALID_ORDER_ID"}'
```

**Expected Result:**
- Status: `404 Not Found` or `500` (PayPal error)
- Error indicates order not found

---

## Edge Cases

### Test 15: Multiple Winners (Split Payout)

**Steps:**
1. Create bet with 4 participants (all captured)
2. Settle with 2 winners:

```bash
curl -X POST http://localhost:3001/api/bets/$BET_ID/settle \
  -H "X-User-Id: admin-user-456" \
  -H "X-Is-Admin: true" \
  -d '{
    "winners": ["test-user-123", "test-user-789"]
  }'
```

**Expected Result:**
- Status: `200 OK`
- Each winner gets 50% of pool
- If 4 × $10 = $40 pool, each winner gets $20

**Validation:**
```sql
SELECT user_id, amount_cents FROM payouts WHERE bet_id = 'BET_ID';
-- Both winners should have amount_cents = 2000
```

---

### Test 16: Missing Venmo Handle

**Steps:**
1. Create user without `venmo_handle`:
   ```sql
   INSERT INTO users (id, email) VALUES ('no-venmo-user', 'no@venmo.com');
   ```
2. Try settling with this user as winner:

```bash
curl -X POST http://localhost:3001/api/bets/$BET_ID/settle \
  -H "X-User-Id: admin-user-456" \
  -H "X-Is-Admin: true" \
  -d '{"winners": ["no-venmo-user"]}'
```

**Expected Result:**
- Status: `400 Bad Request`
- Error: `"Venmo handle is required to join bets"` or `"Winner ... does not have a Venmo handle"`

---

## Performance Tests (Optional)

### Test 17: Token Caching

**Objective:** Verify access token is cached.

**Steps:**
1. Make multiple API calls to PayPal (e.g., create multiple orders)
2. Check server logs - should only see one token request
3. Token should be reused until expiry

**Validation:**
- Server logs show `getAccessToken()` called only once
- Subsequent calls use cached token

---

### Test 18: Concurrent Captures

**Objective:** Verify idempotency under concurrency.

**Steps:**
```bash
# Run same capture command 5 times simultaneously
for i in {1..5}; do
  curl -X POST http://localhost:3001/api/bets/$BET_ID/capture \
    -H "X-User-Id: test-user-123" \
    -d '{"orderId": "SAME_ORDER_ID"}' &
done
wait
```

**Expected Result:**
- All requests return same `captureId`
- No database conflicts
- Only one capture in PayPal

---

## Test Checklist

Use this checklist to track your progress:

### Core Functionality
- [ ] Test 1: Create bet
- [ ] Test 2: Join bet (create order)
- [ ] Test 3: Approve payment (manual)
- [ ] Test 4: Capture order
- [ ] Test 5: Multiple participants
- [ ] Test 6: Settle bet
- [ ] Test 7: Check payout status

### Webhooks
- [ ] Test 8: Webhook setup and receive events

### Error Handling
- [ ] Test 9: Join already-joined bet
- [ ] Test 10: Join closed bet
- [ ] Test 11: Settle with uncaptured participants
- [ ] Test 12: Settle with invalid winners
- [ ] Test 13: Settle without admin
- [ ] Test 14: Capture invalid order

### Edge Cases
- [ ] Test 15: Multiple winners (split payout)
- [ ] Test 16: Missing Venmo handle

### Performance
- [ ] Test 17: Token caching
- [ ] Test 18: Concurrent captures

---

## Troubleshooting

### PayPal Errors

**"INSUFFICIENT_FUNDS":**
- Ensure business account has balance (add funds in sandbox)

**"INVALID_RESOURCE_ID":**
- Order ID may be wrong
- Order may have expired (orders expire after 3 hours)

**Webhook not received:**
- Check ngrok is running
- Verify webhook URL in PayPal matches ngrok URL
- Check server logs for incoming requests

**Payout not completing:**
- Sandbox payouts may not complete immediately
- Check PayPal dashboard for actual status
- Venmo handles in sandbox may need special format

### Database Issues

**"Foreign key constraint":**
- Ensure user exists before joining bet
- Check `users` table has required records

**"Unique constraint violation":**
- Trying to join bet twice
- Trying to create duplicate order

---

## Next Steps After Testing

1. **Review logs** for any unexpected errors
2. **Check database** for data consistency
3. **Verify PayPal dashboard** matches your records
4. **Test production credentials** (with small amounts)
5. **Set up monitoring** for webhooks and payouts

---

## Quick Test Script

Save this as `test-paypal.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:3001"
USER_ID="test-user-123"
ADMIN_ID="admin-user-456"

# Test 1: Create bet
echo "Test 1: Creating bet..."
BET_RESPONSE=$(curl -s -X POST $BASE_URL/api/bets \
  -H "Content-Type: application/json" \
  -H "X-User-Id: $USER_ID" \
  -d '{"title":"Test Bet","stakeAmount":10.00,"endsAt":"2024-12-31T23:59:59Z"}')
BET_ID=$(echo $BET_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
echo "Bet ID: $BET_ID"

# Test 2: Join bet
echo "Test 2: Joining bet..."
JOIN_RESPONSE=$(curl -s -X POST $BASE_URL/api/bets/$BET_ID/join \
  -H "X-User-Id: $USER_ID")
ORDER_ID=$(echo $JOIN_RESPONSE | grep -o '"orderId":"[^"]*' | cut -d'"' -f4)
APPROVE_URL=$(echo $JOIN_RESPONSE | grep -o '"approveUrl":"[^"]*' | cut -d'"' -f4)
echo "Order ID: $ORDER_ID"
echo "Approve URL: $APPROVE_URL"
echo "👉 Open this URL in browser to approve payment: $APPROVE_URL"
echo "Press Enter after approving..."
read

# Test 4: Capture
echo "Test 4: Capturing order..."
curl -s -X POST $BASE_URL/api/bets/$BET_ID/capture \
  -H "Content-Type: application/json" \
  -H "X-User-Id: $USER_ID" \
  -d "{\"orderId\":\"$ORDER_ID\"}" | jq

echo "✅ Basic flow complete! Check database and PayPal dashboard."
```

Make executable: `chmod +x test-paypal.sh`
