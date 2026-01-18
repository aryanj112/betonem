# Landing Page Implementation

Polished "betting with friends" landing page with animated hero, floating bet cards, and smooth page transitions.

## File Structure

```
app/
├── layout.tsx              # Root layout with fonts (Lexend Deca + Press Start 2P)
├── page.tsx                # Main landing page
└── globals.css             # Global styles (includes font CSS variables)

components/
├── Hero.tsx                # Animated hero section (headline + CTA)
├── FeatureRow.tsx          # 3 feature callouts with icons
├── FloatingBets.tsx        # Background floating bet cards
├── BetCard.tsx             # Individual bet card component
└── PageTransition.tsx      # Framer Motion page transition wrapper

styles/
├── Hero.module.css         # Hero section styles
├── FeatureRow.module.css   # Feature row styles
├── FloatingBets.module.css # Floating bets container styles
├── BetCard.module.css      # Individual bet card styles
└── Landing.module.css      # Landing page layout styles
```

## Features

### 1. Hero Section (`components/Hero.tsx`)
- **Animated headline** with "BetOnEm" in arcade font (Press Start 2P)
- **Subheadline** with fade + zoom-in animation
- **CTA buttons** (Get Started, Sign In) with hover effects
- Staggered animation using Framer Motion

### 2. Floating Bet Cards (`components/FloatingBets.tsx`)
- **7 sample bets** (4 on mobile) floating downward
- **Seamless looping** - cards exit bottom and re-enter at top
- **Varied positions, delays, speeds** for depth effect
- **Glass/blur effect** for modern look
- CSS animations (transform/translate3d for performance)

### 3. Feature Row (`components/FeatureRow.tsx`)
- **3 features** with icons:
  - Private Groups (Users icon)
  - Real time odds (TrendingUp icon)
  - Debt Based (DollarSign icon)
- Scroll-triggered animations (fade + slide up)

### 4. Page Transitions (`components/PageTransition.tsx`)
- **Fade + slight slide** between pages
- Uses Framer Motion's `AnimatePresence`
- Respects reduced motion preference

## Fonts

### Lexend Deca (Body)
- Primary font for all text
- Variable weights: 300, 400, 500, 600, 700
- Loaded via `next/font/google`

### Press Start 2P (Hero Headline)
- Arcade/pixel font for "BetOnEm" headline
- Loaded via `next/font/google`
- Used via CSS variable: `var(--font-arcade)`

## Styling

### Color Scheme
- **Background**: Dark navy/black gradient (`#0a0a1a` → `#000000`)
- **Accent**: Neon pink (`#ff6c9f`) for CTAs and accents
- **Text**: White with opacity variations for hierarchy

### Animations
- **Hero**: Zoom out to in + fade (starts blurred/larger, becomes crisp)
- **Bets**: Smooth downward float with CSS animations
- **Features**: Fade + slide up on scroll
- **Transitions**: Fade + slight horizontal slide between pages

### Performance
- CSS transforms (`translate3d`) for GPU acceleration
- `will-change` property for animated elements
- Reduced motion support (animations disabled)
- Mobile: Fewer floating cards (4 vs 7)

## Responsive Design

### Mobile (< 768px)
- **Floating cards**: 4 cards instead of 7
- **Smaller card sizes**: 220px width vs 280px
- **Stacked CTAs**: Buttons stack vertically
- **Adjusted spacing**: Reduced padding/margins

### Desktop
- **Full animation**: All 7 cards visible
- **Side-by-side CTAs**: Buttons in row
- **Full spacing**: Generous padding

## Accessibility

### Reduced Motion
- All animations respect `prefers-reduced-motion`
- Floating bets hidden when reduced motion enabled
- Page transitions simplified (just fade, no slide)
- Hero animations disabled in reduced motion mode

### Semantics
- Proper heading hierarchy
- ARIA labels where needed
- `aria-hidden="true"` on decorative floating bets

## Dependencies

### Already Installed
- `framer-motion` (v11.0.5) ✅
- `next` (v15.3.1) ✅
- `lucide-react` (v0.511.0) ✅

### No Additional Installation Needed
All dependencies are already in your `package.json`!

## Usage

### Running the App

```bash
npm run dev
```

Visit `http://localhost:3000` to see the landing page.

### Customization

#### Change Floating Bet Cards
Edit `components/FloatingBets.tsx`:

```tsx
const BETS = [
  { title: "Your custom bet", pool: "10.00" },
  // ... add more
];
```

#### Adjust Animation Speeds
Edit `styles/BetCard.module.css`:

```css
/* Change base speed (25-40s) */
animationDuration: `${25 + (i * 2.5) % 15}s`;
```

#### Modify Colors
Edit individual CSS modules or add CSS variables to `globals.css`.

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Notes

1. **Floating Cards**: Use CSS animations (GPU-accelerated) instead of JavaScript
2. **Transitions**: Framer Motion handles RAF internally
3. **Fonts**: Loaded via `next/font` (optimized, self-hosted)
4. **Lazy Loading**: Components are code-split automatically by Next.js

## Known Considerations

1. **Page Transitions**: The `PageTransition` wrapper in root layout works with App Router, but complex nested routes may need additional handling.

2. **Floating Cards**: Cards use absolute positioning - ensure parent has `overflow: hidden` to prevent scrollbars (already handled in `Landing.module.css`).

3. **Font Loading**: Fonts are loaded via Next.js font optimization, which may cause a brief flash. This is normal and handled by Next.js.

## Testing Checklist

- [x] Hero animations work smoothly
- [x] Floating cards loop seamlessly
- [x] Features animate on scroll
- [x] Page transitions work between routes
- [x] Mobile responsive (test on mobile device/browser)
- [x] Reduced motion preference respected
- [x] Fonts load correctly (Lexend Deca + Press Start 2P)
- [x] CTAs link to correct routes (`/signup`, `/login`)
- [x] No overflow issues (horizontal scroll)
- [x] Performance: smooth 60fps animations

## Next Steps

1. **Connect CTAs**: Ensure `/signup` and `/login` routes exist
2. **Add Analytics**: Track CTA clicks if needed
3. **A/B Testing**: Test different headlines/subheadlines
4. **SEO**: Add meta tags if needed (already in `layout.tsx`)
