# Visual Style Guide - Settlement Card

## Settlement Card Anatomy

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  SETTLEMENT INFO ············· (label: 11px, 50% opacity) │
│                                                             │
│  👥 AKPsi House Bets • @akpsi-house ········· (ROW 1)     │
│     └─ icon: 20px, #ff6c9f                                 │
│     └─ name: 18px, weight 700, white 100% ⭐ PROMINENT    │
│     └─ tag: 14px, weight 400, white 50%                   │
│                                                             │
│  Will it snow before December ends? ············ (ROW 2)  │
│     └─ title: 15px, weight 500, white 85%                 │
│                                                             │
│  Today • VENMO ······························· (ROW 3)    │
│     └─ meta: 13px, weight 400, white 55%                  │
│                                                             │
│  ─────────────────────────────────────────────────────     │ (border)
│                                                             │
│  [WON]                                    +$24.50          │
│  └─ badge: 12px, weight 700              └─ 24px, weight 700
│     green bg + border                       green color    │
│                                                             │
│  ─────────────────────────────────────────────────────     │ (border)
│                                                             │
│  💳 Payout via VENMO                      [SENT]           │
│     └─ 13px, white 70%                    └─ 11px badge   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Typography Scale

```
Page Title:      32-48px (Press Start 2P, arcade font)
Group Name:      18px    (Lexend Deca, weight 700) ⭐ LARGEST IN CARD
Amount:          24px    (Lexend Deca, weight 700)
Bet Title:       15px    (Lexend Deca, weight 500)
Payout Method:   13px    (Lexend Deca, weight 400)
Meta Info:       13px    (Lexend Deca, weight 400)
Result Badge:    12px    (Lexend Deca, weight 700, uppercase)
Info Label:      11px    (Lexend Deca, weight 600, uppercase)
Status Badge:    11px    (Lexend Deca, weight 600, uppercase)
```

---

## Color Palette

### Background
```css
Page Background:        linear-gradient(180deg, #0a0a1a 0%, #000000 100%)
Radial Overlay:         rgba(255, 108, 159, 0.04)
Card Background:        rgba(255, 255, 255, 0.03)
Card Border:            rgba(255, 255, 255, 0.1)
Card Border (hover):    rgba(255, 108, 159, 0.3)
```

### Text
```css
Primary Text (Group):   rgba(255, 255, 255, 1.0)   ⭐ 100%
Secondary Text (Bet):   rgba(255, 255, 255, 0.85)
Tertiary Text (Meta):   rgba(255, 255, 255, 0.55)
Label Text:             rgba(255, 255, 255, 0.5)
```

### Accent & Status
```css
Primary Accent:         #ff6c9f (pink)
Success (WON):          #22c55e (green)
Error (LOST):           #ef4444 (red)
Neutral (PUSH):         #9ca3af (gray)
```

### Badges
```css
WON Badge:
  background: rgba(34, 197, 94, 0.15)
  border: 1px solid rgba(34, 197, 94, 0.3)
  color: #22c55e

LOST Badge:
  background: rgba(239, 68, 68, 0.15)
  border: 1px solid rgba(239, 68, 68, 0.3)
  color: #ef4444

PUSH Badge:
  background: rgba(156, 163, 175, 0.15)
  border: 1px solid rgba(156, 163, 175, 0.3)
  color: #9ca3af
```

---

## Spacing System

```
Card Padding:           24px (desktop), 20px (mobile)
Section Gap:            20px
Row Gap (small):        12px
Row Gap (tiny):         8px
Icon Gap:               10px
Badge Gap:              8px
Grid Gap:               24px (desktop), 16px (mobile)
```

---

## Animation Specs

### Card Entrance
```javascript
initial: { opacity: 0, y: 20 }
animate: { opacity: 1, y: 0 }
duration: 400ms
delay: index * 80ms (staggered)
easing: [0.25, 0.46, 0.45, 0.94] (easeOutQuad)
```

### Card Hover
```css
transform: translateY(-4px)
box-shadow: 0 8px 30px rgba(255, 108, 159, 0.15)
border-color: rgba(255, 108, 159, 0.3)
transition: 200ms ease
```

### Accent Border (hover)
```css
top: 0
height: 2px
background: linear-gradient(90deg, #ff6c9f 0%, #ff3d7a 100%)
opacity: 0 → 1 (on hover)
```

---

## Responsive Breakpoints

```
Mobile:         < 640px
  - Single column grid
  - Card padding: 20px
  - Group name: 16px
  - Amount: 20px
  - Result section stacks vertically

Tablet:         640px - 767px
  - Single column grid
  - Full-size cards

Desktop:        768px+
  - Two column grid
  - Full hover effects
  - Card padding: 24px
  - Group name: 18px
  - Amount: 24px

Large Desktop:  1200px+
  - Increased grid gap (32px)
```

---

## Before vs. After Comparison

### BEFORE (Old Tailwind Implementation)
```
Settlement display was part of a larger stats page with:
- Group settlement info buried in a separate section
- Group name in small text within a complex transaction layout
- Focus on "who pays whom" rather than individual settlement clarity
- Tailwind utility classes
- No prominent group identification in settlement cards
```

### AFTER (New CSS Modules Implementation)
```
Clean earnings dashboard with:
✅ Group name is THE FOCAL POINT of each settlement
✅ 18px bold text (largest in card)
✅ Group icon in accent color for quick recognition
✅ Clear visual hierarchy (label → group → bet → meta)
✅ Structured Settlement Info block
✅ CSS Modules (no Tailwind)
✅ Framer Motion animations
✅ Responsive grid layout
✅ Consistent with landing page design
```

---

## Key Improvement: Group Name Prominence

### Old Approach (settlement-info.tsx)
- Group name appeared in a header or description
- Similar size to other text (16px)
- Part of a "Who Pays Whom" transaction layout
- Not the primary focus

### New Approach (SettlementCard.tsx)
- **Group name is FIRST and LARGEST** (18px, weight 700)
- **Accompanied by colored icon** (Users, #ff6c9f)
- **Dedicated Settlement Info block** with clear hierarchy
- **Optional group tag** displayed inline for context
- **Visual separation** with border-bottom

```
Visual Weight Distribution:

Old:
  Group Name:  ■■■ (similar to other text)
  Bet Title:   ■■■
  Amount:      ■■■■

New:
  Group Name:  ■■■■■■ ⭐ (MOST PROMINENT)
  Bet Title:   ■■■■
  Amount:      ■■■■■
```

---

## Design Consistency with Landing Page

### Shared Elements
✅ Dark gradient background (#0a0a1a → #000000)
✅ Radial gradient overlays (pink accent)
✅ Lexend Deca body font
✅ Press Start 2P headline font
✅ #ff6c9f primary accent color
✅ 12px border radius
✅ Subtle transparency layers
✅ EaseOutQuad animation easing
✅ Reduced motion support

### Landing Page Hero
```css
.hero {
  font-family: var(--font-arcade);
  font-size: clamp(3.5rem, 10vw, 6.5rem);
  color: #ffffff;
}
.heroAccent {
  color: #ff6c9f;
}
```

### Earnings Page Header
```css
.title {
  font-family: var(--font-arcade);
  font-size: clamp(2rem, 5vw, 3rem);
  color: #ffffff;
}
.titleAccent {
  color: #ff6c9f;
}
```

**Result: Seamless visual continuity across the entire app**

---

Built with CSS Modules, Framer Motion, and attention to detail ✨

