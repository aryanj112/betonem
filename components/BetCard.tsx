/**
 * Floating Bet Card Component
 * Used for background animation
 */

import styles from "@/styles/BetCard.module.css";

interface BetCardProps {
  title: string;
  pool: string;
  delay: number;
  xPosition: number;
  speed: number;
  width: number;
  opacity: number;
}

export function BetCard({ title, pool, delay, xPosition, speed, width, opacity }: BetCardProps) {
  return (
    <div
      className={styles.card}
      style={{
        left: `${xPosition}%`,
        width: `${width}px`,
        opacity: opacity,
        animationDelay: `${delay}s`,
        animationDuration: `${speed}s`,
      }}
    >
      <div className={styles.statusPill}>OPEN</div>
      <div className={styles.title}>{title}</div>
      <div className={styles.pool}>
        <span className={styles.poolLabel}>Pool</span>
        <span className={styles.poolAmount}>${pool}</span>
      </div>
    </div>
  );
}
