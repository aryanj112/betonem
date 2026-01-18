/**
 * Empty State Component for Earnings
 */

"use client";

import { motion } from "framer-motion";
import { Receipt } from "lucide-react";
import styles from "@/styles/Earnings.module.css";

const emptyStateVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

export function EarningsEmptyState() {
  return (
    <motion.div
      className={styles.emptyState}
      variants={emptyStateVariants}
      initial="hidden"
      animate="visible"
    >
      <Receipt className={styles.emptyStateIcon} />
      <h2 className={styles.emptyStateTitle}>No Settlements Yet</h2>
      <p className={styles.emptyStateText}>
        Your settled bets and payouts will appear here
      </p>
    </motion.div>
  );
}

