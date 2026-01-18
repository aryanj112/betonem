/**
 * Floating Bets Background Animation
 * Renders bet cards floating downward in a loop
 */

"use client";

import { BetCard } from "./BetCard";
import styles from "@/styles/FloatingBets.module.css";

const BETS = [
  { title: "Will Jack get caught cheating on his test?", pool: "9.21" },
  { title: "Will Ethan lose all his money gambling?", pool: "3.45" },
  { title: "Will Sriman land Jane Street?", pool: "20.95" },
  { title: "Will a spring break trip make it out of the GC?", pool: "0.21" },
  { title: "Will Amir get arrested in 2026?", pool: "6.85" },
  { title: "Will heads fight about something not important within the next 3 months?", pool: "1.12" },
  { title: "Will Omicron become tolerable in 2026?", pool: "15.62" },
];

export function FloatingBets() {
  // Generate varied positions, delays, speeds, sizes, and opacity for depth
  const getCards = () => {
    const cards = [];
    const count = typeof window !== "undefined" && window.innerWidth < 768 ? 4 : 7;
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    
    // Track used positions to prevent overlap
    const usedPositions: Array<{ start: number; end: number }> = [];
    const minGap = isMobile ? 15 : 20; // Minimum gap between cards (in percentage)
    
    for (let i = 0; i < count; i++) {
      const bet = BETS[i % BETS.length];
      
      // Randomize card widths: between 140-350px (desktop) or 120-280px (mobile)
      const baseWidth = isMobile ? 120 : 140;
      const widthVariation = isMobile ? 160 : 210; // Wider range for more variation
      const randomSeed1 = (i * 17 + 23) % 100;
      const randomSeed2 = (i * 31 + 47) % 100;
      const width = baseWidth + (randomSeed1 % widthVariation);
      
      // Convert pixel width to percentage for overlap checking
      const estimatedVw = typeof window !== "undefined" ? window.innerWidth : 1200;
      const cardWidthPercent = (width / estimatedVw) * 100;
      
      // Find non-overlapping X position
      let xPosition: number;
      let attempts = 0;
      const maxAttempts = 100;
      
      do {
        // Randomize X positions: spread across entire width (5% to 85%)
        const randomSeed3 = (i * 43 + 59 + attempts * 13) % 100;
        xPosition = 5 + (randomSeed3 * 0.8); // 5% to 85%
        
        // Check if position overlaps with existing cards
        // Account for card width when checking overlaps
        const cardStart = xPosition;
        const cardEnd = xPosition + cardWidthPercent;
        
        // Ensure card doesn't go beyond viewport (95% max)
        if (cardEnd > 95) {
          attempts++;
          continue;
        }
        
        const overlaps = usedPositions.some((used) => {
          // Check if new card overlaps with any existing card
          // Cards overlap if one starts before the other ends (with gap buffer)
          const gapBuffer = minGap;
          return !(cardEnd + gapBuffer < used.start || cardStart - gapBuffer > used.end);
        });
        
        if (!overlaps) {
          // Record this position for future cards
          usedPositions.push({ start: cardStart, end: cardEnd });
          break;
        }
        
        attempts++;
      } while (attempts < maxAttempts);
      
      // Fallback: if we couldn't find a non-overlapping position, distribute evenly
      if (attempts >= maxAttempts) {
        // Calculate evenly spaced positions with gaps
        const totalUsableWidth = 85 - 5; // 80% usable width
        const gapBetweenCards = (totalUsableWidth - (cardWidthPercent * count)) / (count + 1);
        xPosition = 5 + gapBetweenCards + (i * (cardWidthPercent + gapBetweenCards));
        
        // Ensure it doesn't exceed bounds
        xPosition = Math.min(xPosition, 85 - cardWidthPercent);
        
        const cardStart = xPosition;
        const cardEnd = xPosition + cardWidthPercent;
        usedPositions.push({ start: cardStart, end: cardEnd });
      }
      
      // Randomize delays: stagger so they don't all start at once (minimum 3s to avoid top visibility)
      const minDelay = 3; // Minimum 3 second delay
      const delayVariation = 22; // Variation of 22 seconds
      const delay = minDelay + ((i * 3.1 + randomSeed1 * 0.2 + randomSeed2 * 0.1) % delayVariation);
      
      // Randomize speeds: vary between 30-50 seconds for depth
      const speed = 30 + (randomSeed2 % 20); // 30-50 seconds
      
      // Randomize opacity: between 0.05-0.11 (reduced by 40% from previous 0.08-0.18)
      const opacity = 0.05 + (randomSeed1 % 6) * 0.01; // 0.05-0.11
      
      cards.push({
        ...bet,
        xPosition,
        delay,
        speed,
        width,
        opacity,
      });
    }
    
    return cards;
  };

  const cards = getCards();

  return (
    <div className={styles.container} aria-hidden="true">
      {cards.map((card, index) => (
        <BetCard
          key={`${card.title}-${index}`}
          title={card.title}
          pool={card.pool}
          delay={card.delay}
          xPosition={card.xPosition}
          speed={card.speed}
          width={card.width}
          opacity={card.opacity}
        />
      ))}
    </div>
  );
}
