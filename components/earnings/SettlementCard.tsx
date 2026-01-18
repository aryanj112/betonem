/**
 * Settlement Card Component
 * Displays individual settlement with prominent group name
 */

"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Users, CreditCard } from "lucide-react";
import styles from "@/styles/SettlementCard.module.css";

export type SettlementResult = "WON" | "LOST" | "PUSH";
export type PayoutMethod = "VENMO" | "PAYPAL";
export type PayoutStatus = "SENT" | "PENDING" | "FAILED";

export interface Settlement {
  id: string;
  groupName: string;
  groupTag?: string;
  betTitle: string;
  result: SettlementResult;
  amount: number;
  settledAt: string;
  payoutStatus: PayoutStatus;
  payoutMethod: PayoutMethod;
  marketId?: string; // For navigation
  groupId?: string;  // For navigation
}

interface SettlementCardProps {
  settlement: Settlement;
  index: number;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      delay: index * 0.08,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
};

function formatAmount(amount: number): string {
  const sign = amount >= 0 ? "+" : "";
  return `${sign}$${Math.abs(amount).toFixed(2)}`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return date.toLocaleDateString("en-US", { 
    month: "short", 
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined
  });
}

export function SettlementCard({ settlement, index }: SettlementCardProps) {
  const router = useRouter();
  const {
    groupName,
    groupTag,
    betTitle,
    result,
    amount,
    settledAt,
    payoutStatus,
    payoutMethod,
    marketId,
    groupId,
  } = settlement;

  const resultClass =
    result === "WON"
      ? styles.resultWon
      : result === "LOST"
      ? styles.resultLost
      : styles.resultPush;

  const amountClass =
    amount > 0
      ? styles.amountPositive
      : amount < 0
      ? styles.amountNegative
      : styles.amountNeutral;

  const statusClass =
    payoutStatus === "SENT"
      ? styles.statusSent
      : payoutStatus === "PENDING"
      ? styles.statusPending
      : styles.statusFailed;

  const handleClick = () => {
    if (marketId && groupId) {
      router.push(`/groups/${groupId}/bets/${marketId}`);
    }
  };

  return (
    <motion.article
      className={styles.card}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      custom={index}
      onClick={handleClick}
      style={{ cursor: marketId && groupId ? 'pointer' : 'default' }}
    >
      {/* Settlement Info - Prominent Section */}
      <div className={styles.settlementInfo}>
        <div className={styles.infoLabel}>Settlement Info</div>
        
        {/* Group Name - MOST PROMINENT */}
        <div className={styles.groupRow}>
          <Users className={styles.groupIcon} />
          <h3 className={styles.groupName}>
            {groupName}
            {groupTag && <span className={styles.groupTag}>{groupTag}</span>}
          </h3>
        </div>

        {/* Bet Title */}
        <div className={styles.betTitle}>{betTitle}</div>

        {/* Meta Info */}
        <div className={styles.metaRow}>
          <span>{formatDate(settledAt)}</span>
          <span className={styles.metaDivider} />
          <span>{payoutMethod}</span>
        </div>
      </div>

      {/* Result & Amount */}
      <div className={styles.resultSection}>
        <span className={`${styles.resultBadge} ${resultClass}`}>
          {result}
        </span>
        <span className={`${styles.amount} ${amountClass}`}>
          {formatAmount(amount)}
        </span>
      </div>

      {/* Payout Status */}
      <div className={styles.payoutStatus}>
        <div className={styles.payoutMethod}>
          <CreditCard className={styles.payoutIcon} />
          <span>Payout via {payoutMethod}</span>
        </div>
        <span className={`${styles.statusBadge} ${statusClass}`}>
          {payoutStatus}
        </span>
      </div>
    </motion.article>
  );
}

