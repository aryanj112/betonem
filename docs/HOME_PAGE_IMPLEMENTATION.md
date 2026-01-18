# Home Page Implementation - Updated with Real Data

## Overview
Fully functional Home page at `/home` that fetches real bet data from Supabase. Features a clean two-column responsive layout matching the existing dark theme and motion system.

---

## File Structure

```
app/(authenticated)/home/page.tsx          # Server Component - fetches data
components/home/
  ├── HomeHeader.tsx                       # Client Component - Header with Create/Join buttons
  ├── BetsGrid.tsx                         # Client Component - Grid layout
  └── BetCard.tsx                          # Client Component - Individual bet card
styles/Home.module.css                     # All home page styling
```

---

## Data Flow

### Server Component (page.tsx)
1. Authenticates user
2. Fetches user's group memberships
3. Fetches all markets from those groups
4. Fetches user's bets on those markets
5. Transforms data for display
6. Passes to client components

### Database Queries

**User's Groups:**
```sql
SELECT group_id FROM group_members WHERE user_id = ?
```

**Markets with Group Info:**
```sql
SELECT 
  markets.*,
  groups.name,
  groups.id
FROM markets
JOIN groups ON markets.group_id = groups.id
WHERE markets.group_id IN (user's groups)
  AND markets.status IN ('open', 'locked', 'resolved')
ORDER BY created_at DESC
LIMIT 50
```

**User's Bets:**
```sql
SELECT market_id, position, amount
FROM bets
WHERE user_id = ?
  AND market_id IN (markets list)
```

---

## Data Transformations

### Status Mapping
- Database: `"open"` → Display: `"OPEN"`
- Database: `"locked"` → Display: `"SETTLING"`
- Database: `"resolved"` → Display: `"SETTLED"`

### Lean Percentage Calculation
```typescript
const totalPool = yes_pool + no_pool;
const yesPercent = totalPool > 0 
  ? Math.round((yes_pool / totalPool) * 100) 
  : 50; // Default to 50% if no bets yet
```

### Time Remaining Calculation
For OPEN markets only:
- If days > 0: `"${days}d left"`
- Else if hours > 0: `"${hours}h left"`
- Else: `"Closing soon"`

Based on `lock_time` field.

---

## Features

### ✅ Real Data Integration
- Fetches actual markets from Supabase
- Shows user's betting position on each market
- Displays accurate pool amounts from `yes_pool + no_pool`
- Calculates real lean percentages from pool distribution
- Shows actual group names
- Computes time remaining from `lock_time`

### ✅ User Bet Indicators
When user has bet on a market, shows badge:
- Position: "YES" or "NO"
- Amount: `$${amount}`
- Pink badge with accent color

### ✅ Empty State
When user has no groups or no bets:
```
"No bets yet. Create or join a group to get started!"
```

### ✅ Loading State
Uses Suspense boundary with LoadingSpinner during data fetch.

### ✅ Navigation
Clicking a bet card navigates to:
```
/groups/${groupId}/bets/${marketId}
```

### ✅ Action Buttons
- **Create**: Navigates to `/home?action=create` (future: create bet flow)
- **Join**: Navigates to `/join` (existing join group flow)

---

## Component Props

### BetCard
```typescript
interface BetCardProps {
  id: string;              // market.id
  title: string;           // market.title
  poolAmount: number;      // yes_pool + no_pool
  status: "OPEN" | "SETTLING" | "SETTLED";
  leanPercent: number;     // 0-100, calculated from pools
  leaningSide: "YES" | "NO";
  groupName?: string;      // groups.name
  groupId?: string;        // groups.id (for navigation)
  timeRemaining?: string;  // Computed from lock_time
  userPosition?: boolean;  // User's bet: true=YES, false=NO
  userAmount?: number;     // User's bet amount
}
```

### BetsGrid
```typescript
interface BetsGridProps {
  bets: BetCardProps[];
}
```

### HomeHeader
No props - handles navigation internally.

---

## Performance Optimizations

1. **Server-Side Rendering**: Initial data fetch happens on server
2. **Suspense Boundaries**: Non-blocking loading states
3. **Single Query Pattern**: Efficient joins in Supabase query
4. **Limited Results**: Max 50 markets to prevent overload
5. **Client Components**: Only interactive parts are client-side

---

## Security

- ✅ User authentication required (redirects to `/signin`)
- ✅ Only shows markets from user's groups
- ✅ Server-side data validation
- ✅ RLS policies enforced by Supabase

---

## Edge Cases Handled

1. **No groups**: Shows empty state
2. **No markets**: Shows empty state  
3. **No bets placed**: Still shows all available markets
4. **Zero pool**: Defaults to 50/50 lean
5. **Past lock_time**: Doesn't show time remaining
6. **Missing group data**: Gracefully handles undefined

---

## Responsive Behavior

- **Desktop (≥768px)**: 2 columns
- **Mobile (<768px)**: 1 column
- **Actions**: Centered on mobile, right-aligned on desktop
- **Cards**: Click to navigate on all devices

---

## Visual Design

### Conditional Tinting
Each card has subtle background tint based on lean:
- **> 50% YES**: Green tint (stronger as % increases)
- **< 50% YES**: Red tint (stronger as % decreases)
- **= 50%**: No tint (neutral)
- **Max opacity**: 0.15 (very subtle)

### Status Pills
- **OPEN**: Green (`#00ff96`)
- **SETTLING**: Yellow (`#ffc800`)
- **SETTLED**: Gray (`#aaaaaa`)

### User Bet Badge
- Pink background (`rgba(255, 108, 159, 0.2)`)
- Pink border & text (`#ff6c9f`)
- Shows "YES $amount" or "NO $amount"

---

## Future Enhancements

### Immediate TODOs
1. Implement create bet flow from Create button
2. Add filtering (by status, by group)
3. Add sorting options
4. Implement search

### Advanced Features
1. Real-time updates via Supabase subscriptions
2. Infinite scroll for > 50 markets
3. Card details preview on hover
4. Quick bet actions from card
5. Bet history toggle
6. Winnings/losses summary
7. Filter by "My Bets" vs "All Bets"

---

## Testing Checklist

- [x] Page renders with real data
- [x] No TypeScript/ESLint errors
- [x] Authentication redirects work
- [x] Empty state shows when no groups
- [x] Markets display with correct data
- [x] User bet badges show correctly
- [x] Navigation to bet details works
- [x] Time remaining calculates correctly
- [x] Lean percentage matches pools
- [x] Conditional tinting works
- [x] Responsive layout functions
- [x] Loading state shows during fetch

---

## Database Schema Used

### Tables
- `users` - User profiles
- `groups` - Betting groups
- `group_members` - User-group relationships
- `markets` - Bet markets
- `bets` - Individual user bets

### Key Fields
- `markets.status`: 'open' | 'locked' | 'resolved' | 'cancelled'
- `markets.yes_pool`: Total coins bet on YES
- `markets.no_pool`: Total coins bet on NO
- `markets.lock_time`: When betting closes
- `markets.end_time`: When event concludes
- `bets.position`: true (YES) | false (NO)
- `bets.amount`: Coins wagered

---

## Migration from Mock Data

### Removed
- ❌ Static MOCK_BETS array
- ❌ Hardcoded data in BetsGrid
- ❌ Client-side state management for bets

### Added
- ✅ Server Component data fetching
- ✅ Supabase queries with joins
- ✅ Type-safe data transformations
- ✅ Real user bet tracking
- ✅ Dynamic time calculations
- ✅ Group-based filtering
- ✅ Loading and empty states

---

## Example Data Flow

```
User visits /home
  ↓
Server Component runs
  ↓
1. Check auth → Get user ID
  ↓
2. Query group_members → Get group IDs [A, B, C]
  ↓
3. Query markets WHERE group_id IN (A,B,C)
   → Get 12 markets with group info
  ↓
4. Query bets WHERE user_id = X AND market_id IN (...)
   → Get 3 user bets
  ↓
5. Transform data:
   - Calculate lean %
   - Map status
   - Compute time remaining
   - Match user bets
  ↓
6. Pass to BetsGrid component
  ↓
7. Render 12 BetCards
   - 3 show user bet badges
   - All show real pool amounts
   - All show accurate lean bars
  ↓
User clicks card → Navigate to /groups/A/bets/123
```

---

## Success Metrics

✅ **Performance**: Server-side rendering for fast initial load
✅ **Accuracy**: All data reflects actual database state
✅ **UX**: Smooth animations with real data
✅ **Type Safety**: Full TypeScript coverage
✅ **Maintainability**: Clean component separation
✅ **Scalability**: Efficient queries with limits

The Home page is now production-ready and fully integrated with Supabase!

