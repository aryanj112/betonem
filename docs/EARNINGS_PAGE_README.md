# Earnings Page Implementation

## Overview

The Earnings page is a clean, modern dashboard for tracking payouts and settled bets. It features:

- **Prominent settlement cards** with clear visual hierarchy
- **Group names as the focal point** of each settlement
- **CSS Modules** for styling (no Tailwind)
- **Framer Motion** animations with reduced motion support
- **Responsive design** (mobile-first, adapts to desktop)
- **Consistent design system** matching the landing page

## File Structure

```
/Users/hashemalomar/betonem/
├── app/(authenticated)/earnings/
│   └── page.tsx                              # Main earnings page with mock data
├── components/earnings/
│   ├── EarningsHeader.tsx                    # Page header component
│   ├── SettlementCard.tsx                    # Individual settlement card
│   └── SettlementsList.tsx                   # Grid layout for settlements
└── styles/
    ├── Earnings.module.css                   # Page-level styles
    ├── EarningsHeader.module.css             # Header component styles
    ├── SettlementCard.module.css             # Card component styles (key file)
    └── SettlementsList.module.css            # Grid layout styles
```

## Design System

### Typography

- **Body text**: Lexend Deca (`var(--font-lexend-deca)`)
- **Page title**: Press Start 2P (`var(--font-arcade)`) with accent color
- Font weights: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

### Colors

- **Background**: Dark gradient (`#0a0a1a` → `#000000`)
- **Primary accent**: `#ff6c9f` (pink/red gradient)
- **Success**: `#22c55e` (green)
- **Error**: `#ef4444` (red)
- **Neutral**: `#9ca3af` (gray)
- **Text**: White with varying opacity (100%, 85%, 70%, 55%, 50%)

### Animation

- **Staggered entrance**: Cards fade and slide up with 80ms delay between each
- **Hover effects**: Cards lift 4px with shadow and accent border
- **Easing**: `[0.25, 0.46, 0.45, 0.94]` (easeOutQuad)
- **Reduced motion**: All animations disabled when user prefers reduced motion

## Settlement Card Hierarchy

### 1. Settlement Info (Most Prominent)

```
┌─────────────────────────────────────┐
│ SETTLEMENT INFO (label)             │
│ 👥 AKPsi House Bets • @akpsi-house │ ← GROUP NAME (bold, 18px, white)
│ Will it snow before December ends?  │ ← Bet title (15px, 85% opacity)
│ Today • VENMO                       │ ← Meta info (13px, 55% opacity)
└─────────────────────────────────────┘
```

**Key improvements:**
- Group name is **1.125rem (18px)** with **font-weight: 700**
- Group icon (Users) in accent color (#ff6c9f)
- Optional group tag/handle displayed inline
- Clear visual separation with border-bottom

### 2. Result & Amount

- **Result badge**: Colored pill (WON/LOST/PUSH)
- **Amount**: Large text (1.5rem) with +/- sign and color coding

### 3. Payout Status

- **Payout method**: Icon + text (Venmo/PayPal)
- **Status badge**: Small pill (SENT/PENDING/FAILED)

## Mock Data

The page includes 12 sample settlements demonstrating:

- ✅ **WON bets** with positive amounts
- ❌ **LOST bets** with negative amounts
- ⚖️ **PUSH bets** with $0.00
- 📤 Various payout statuses (SENT, PENDING, FAILED)
- 💳 Multiple payment methods (Venmo, PayPal)
- 📅 Different dates (today, yesterday, days ago, formatted)

## Responsive Behavior

### Mobile (< 640px)
- Single column grid
- Result section stacks vertically
- Reduced padding
- Slightly smaller fonts

### Tablet (640px - 767px)
- Single column grid
- Full-size cards

### Desktop (768px+)
- Two-column grid
- Hover effects enabled
- Optimal spacing

### Large Desktop (1200px+)
- Increased gap between cards (2rem)

## Accessibility

- ✅ Semantic HTML (`<article>`, `<header>`, `<h1>`, `<h3>`)
- ✅ Proper heading hierarchy
- ✅ Color is not the only indicator (text + icons)
- ✅ Respects `prefers-reduced-motion`
- ✅ Sufficient color contrast
- ✅ Logical tab order

## Usage

### View the page

```bash
# Start the development server
npm run dev

# Navigate to:
http://localhost:3000/earnings
```

### Integrate with real data

Replace the `MOCK_SETTLEMENTS` array in `page.tsx` with actual data fetched from your backend:

```typescript
// Example: Fetch from Supabase
const { data: settlements } = await supabase
  .from("settlements")
  .select("*")
  .order("settled_at", { ascending: false });
```

### Customize settlement cards

Edit `/styles/SettlementCard.module.css`:

- `.groupName`: Adjust font size/weight for group names
- `.card:hover`: Modify hover effects
- `.resultBadge`: Customize badge styling
- `.amount`: Change amount display size

## Key Features

### 1. Prominent Group Names

The group name is the **most visually prominent** element in each settlement card:
- Largest font size (1.125rem)
- Boldest weight (700)
- Highest contrast (100% white)
- Accompanied by colored icon

### 2. Smooth Animations

```typescript
// Staggered entrance
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: index * 0.08, // 80ms stagger
    },
  }),
};
```

### 3. Visual Feedback

- **Hover state**: Card lifts with shadow + accent border
- **Gradient top border**: Reveals on hover
- **Color-coded results**: Green (won), red (lost), gray (push)
- **Status indicators**: Colored badges for payout status

### 4. Consistent Styling

Matches the landing page aesthetic:
- Same dark gradient background
- Same radial gradient overlays
- Same fonts (Lexend Deca + Press Start 2P)
- Same accent color (#ff6c9f)
- Same border radius (12px)

## Performance

- ✅ CSS Modules (scoped, tree-shakeable)
- ✅ Framer Motion (lazy-loaded animations)
- ✅ No unnecessary re-renders
- ✅ Optimized media queries

## Browser Support

- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers

## Future Enhancements

- [ ] Add filtering (by group, date range, result)
- [ ] Add sorting (by amount, date, group)
- [ ] Add summary statistics at top (total earnings, win rate, etc.)
- [ ] Add export functionality (CSV, PDF)
- [ ] Add real-time updates via WebSocket
- [ ] Add pagination for large datasets
- [ ] Add "mark as paid" action button
- [ ] Add dispute resolution flow

## Credits

- **Design**: Inspired by modern fintech dashboards
- **Fonts**: Lexend Deca (Google Fonts), Press Start 2P (Google Fonts)
- **Icons**: Lucide React
- **Animation**: Framer Motion

---

Built with ❤️ for BetOnEm

