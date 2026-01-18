/**
 * Bets Grid Component
 */

"use client";

import { motion } from "framer-motion";
import { BetCard, BetCardProps } from "./BetCard";
import styles from "@/styles/Home.module.css";

interface BetsGridProps {
  bets: BetCardProps[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.2,
    },
  },
};

export function BetsGrid({ bets }: BetsGridProps) {
  if (bets.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyStateText}>No bets yet. Create or join a group to get started!</p>
      </div>
    );
  }

  return (
    <motion.div
      className={styles.betsGrid}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {bets.map((bet) => (
        <BetCard key={bet.id} {...bet} />
      ))}
    </motion.div>
  );
}
