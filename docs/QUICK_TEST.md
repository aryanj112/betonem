# Quick Test Checklist

Fast reference for testing PayPal integration.

## Setup (One-time)

```bash
# 1. Install deps
npm install

# 2. Set env vars
export PAYPAL_CLIENT_ID="your_id"
export PAYPAL_CLIENT_SECRET="your_secret"
export PAYPAL_BASE_URL="https://api-m.sandbox.paypal.com"
export DATABASE_URL="postgresql://..."

# 3. Setup DB
npm run db:generate
npm run db:migrate

# 4. Start server
npm run dev:server
```

## Quick Test Flow

### 1. Create Test Users

```sql
INSERT INTO users (id, email, venmo_handle) 
VALUES 
  ('user1', 'user1@test.com', 'user1'),
  ('user2', 'user2@test.com', 'user2'),
  ('admin', 'admin@test.com', 'admin')
ON CONFLICT (id) DO NOTHING;
```

### 2. Create Bet

```bash
BET_ID=$(curl -s -X POST http://localhost:3001/api/bets \
  -H "X-User-Id: user1" \
  -d '{"title":"Test Bet","stakeAmount":10.00,"endsAt":"2024-12-31T23:59:59Z"}' \
  | jq -r '.id')
echo "Bet ID: $BET_ID"
```

### 3. Join Bet (Get Order)

```bash
JOIN_RESULT=$(curl -s -X POST http://localhost:3001/api/bets/$BET_ID/join \
  -H "X-User-Id: user1")

ORDER_ID=$(echo $JOIN_RESULT | jq -r '.orderId')
APPROVE_URL=$(echo $JOIN_RESULT | jq -r '.approveUrl')

echo "Order ID: $ORDER_ID"
echo "👉 Approve: $APPROVE_URL"
```

### 4. Capture (After Approval)

```bash
curl -X POST http://localhost:3001/api/bets/$BET_ID/capture \
  -H "X-User-Id: user1" \
  -d "{\"orderId\":\"$ORDER_ID\"}" | jq
```

### 5. Settle Bet (Admin)

```bash
curl -X POST http://localhost:3001/api/bets/$BET_ID/settle \
  -H "X-User-Id: admin" \
  -H "X-Is-Admin: true" \
  -d '{"winners":["user1"]}' | jq

# Save batchId from response
```

### 6. Check Payout

```bash
curl http://localhost:3001/api/payouts/$BATCH_ID \
  -H "X-User-Id: admin" | jq
```

## Verification

### Database Checks

```sql
-- Check bet
SELECT id, title, status, stake_amount_cents FROM bets WHERE id = 'BET_ID';

-- Check participants
SELECT user_id, status, order_id, capture_id 
FROM bet_participants 
WHERE bet_id = 'BET_ID';

-- Check payouts
SELECT user_id, amount_cents, status, batch_id 
FROM payouts 
WHERE bet_id = 'BET_ID';
```

### Expected States

- **After join:** `bet_participants.status = 'CREATED'`
- **After capture:** `bet_participants.status = 'CAPTURED'`, `bet.status = 'OPEN'`
- **After settle:** `bet.status = 'SETTLED'`, `payouts.status = 'PENDING'`

## Common Issues

| Issue | Solution |
|-------|----------|
| "Missing venmo handle" | Update user: `UPDATE users SET venmo_handle = 'handle' WHERE id = 'user1'` |
| "Bet not found" | Check BET_ID is correct |
| "Cannot settle" | Ensure all participants have `status = 'CAPTURED'` |
| PayPal login fails | Use sandbox personal account from PayPal dashboard |
| Webhook not received | Check ngrok is running, URL matches PayPal webhook config |

## Test Script

Save as `quick-test.sh`:

```bash
#!/bin/bash
set -e

BASE="http://localhost:3001"
USER="user1"
ADMIN="admin"

echo "📝 Creating bet..."
BET=$(curl -s -X POST $BASE/api/bets -H "X-User-Id: $USER" \
  -d '{"title":"Quick Test","stakeAmount":10.00,"endsAt":"2024-12-31T23:59:59Z"}')
BET_ID=$(echo $BET | jq -r '.id')
echo "✅ Bet created: $BET_ID"

echo "🔗 Joining bet..."
JOIN=$(curl -s -X POST $BASE/api/bets/$BET_ID/join -H "X-User-Id: $USER")
ORDER_ID=$(echo $JOIN | jq -r '.orderId')
APPROVE_URL=$(echo $JOIN | jq -r '.approveUrl')
echo "✅ Order created: $ORDER_ID"
echo "🌐 Approve URL: $APPROVE_URL"
echo ""
echo "⚠️  MANUAL STEP: Open approve URL and approve payment"
read -p "Press Enter after approving payment..."

echo "💰 Capturing order..."
CAPTURE=$(curl -s -X POST $BASE/api/bets/$BET_ID/capture \
  -H "X-User-Id: $USER" -d "{\"orderId\":\"$ORDER_ID\"}")
echo "✅ Capture result:"
echo $CAPTURE | jq

echo "🏁 Settling bet..."
SETTLE=$(curl -s -X POST $BASE/api/bets/$BET_ID/settle \
  -H "X-User-Id: $ADMIN" -H "X-Is-Admin: true" \
  -d "{\"winners\":[\"$USER\"]}")
BATCH_ID=$(echo $SETTLE | jq -r '.batchId')
echo "✅ Settled! Batch ID: $BATCH_ID"

echo "📊 Checking payout..."
curl -s $BASE/api/payouts/$BATCH_ID -H "X-User-Id: $ADMIN" | jq

echo ""
echo "✅ All tests complete!"
```

Run: `chmod +x quick-test.sh && ./quick-test.sh`
