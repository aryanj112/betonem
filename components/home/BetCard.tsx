/**
 * Bet Card Component with Conditional Tint
 */

"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import styles from "@/styles/Home.module.css";

export interface BetCardProps {
  id: string;
  title: string;
  poolAmount: number;
  status: "OPEN" | "SETTLING" | "SETTLED";
  leanPercent: number; // 0-100
  leaningSide: "YES" | "NO";
  groupName?: string;
  groupId?: string;
  timeRemaining?: string;
  userPosition?: boolean; // true = YES, false = NO
  userAmount?: number;
}

/**
 * Calculate tint color based on lean percentage
 * 50% = neutral (no tint)
 * > 50% = green tint (strength increases with distance from 50)
 * < 50% = red tint (strength increases with distance from 50)
 */
function calculateTint(leanPercent: number, leaningSide: "YES" | "NO"): string {
  const deviation = Math.abs(leanPercent - 50);
  const opacity = Math.min(deviation / 100, 0.15); // Max 0.15 opacity for subtlety
  
  if (leanPercent > 50) {
    // Leaning toward win/YES
    return `rgba(0, 255, 150, ${opacity})`;
  } else if (leanPercent < 50) {
    // Leaning toward lose/NO
    return `rgba(255, 80, 120, ${opacity})`;
  }
  
  return "transparent";
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

export function BetCard({
  id,
  title,
  poolAmount,
  status,
  leanPercent,
  leaningSide,
  groupName,
  groupId,
  timeRemaining,
  userPosition,
  userAmount,
}: BetCardProps) {
  const router = useRouter();
  const tintColor = calculateTint(leanPercent, leaningSide);
  const statusClass = status.toLowerCase();

  const handleClick = () => {
    // Navigate to bet detail page
    if (groupId) {
      router.push(`/groups/${groupId}/bets/${id}`);
    }
  };

  return (
    <motion.article
      className={styles.betCard}
      style={{ "--card-tint": tintColor } as React.CSSProperties}
      variants={cardVariants}
      whileHover={{
        y: -4,
        transition: { duration: 0.2 },
      }}
      onClick={handleClick}
    >
      <div className={styles.cardHeader}>
        <span className={`${styles.statusPill} ${styles[`status-${statusClass}`]}`}>
          {status}
        </span>
        {userPosition !== undefined && userAmount && (
          <span className={styles.userBetBadge}>
            {userPosition ? "YES" : "NO"} ${userAmount}
          </span>
        )}
      </div>

      <h3 className={styles.betTitle}>{title}</h3>

      <div className={styles.leanIndicator}>
        <div className={styles.leanBar}>
          <div
            className={styles.leanFill}
            style={{ width: `${leanPercent}%` }}
          />
        </div>
        <div className={styles.leanText}>
          <span className={styles.leanPercent}>{leanPercent}%</span>
          <span className={styles.leanSide}>{leaningSide}</span>
          <span className={styles.leanDivider}>•</span>
          <span className={styles.leanOpposite}>
            {100 - leanPercent}% {leaningSide === "YES" ? "NO" : "YES"}
          </span>
        </div>
      </div>

      <div className={styles.cardFooter}>
        <div className={styles.poolInfo}>
          <span className={styles.poolLabel}>Pool</span>
          <span className={styles.poolAmount}>
            ${poolAmount.toLocaleString()}
          </span>
        </div>
        
        {(groupName || timeRemaining) && (
          <div className={styles.metadata}>
            {groupName && (
              <span className={styles.metadataItem}>{groupName}</span>
            )}
            {timeRemaining && (
              <>
                {groupName && <span className={styles.metadataDivider}>•</span>}
                <span className={styles.metadataItem}>{timeRemaining}</span>
              </>
            )}
          </div>
        )}
      </div>
    </motion.article>
  );
}
