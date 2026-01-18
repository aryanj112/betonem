/**
 * Earnings Header Component
 * Page title and subtitle for the earnings dashboard
 */

"use client";

import { motion } from "framer-motion";
import styles from "@/styles/EarningsHeader.module.css";

const headerVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

export function EarningsHeader() {
  return (
    <motion.header
      className={styles.header}
      variants={headerVariants}
      initial="hidden"
      animate="visible"
    >
      <h1 className={styles.title}>
        Earn<span className={styles.titleAccent}>ings</span>
      </h1>
      <p className={styles.subtitle}>
        Track payouts and settled bets across all your groups
      </p>
    </motion.header>
  );
}

