/**
 * Earnings Page Wrapper - Client Component for Animations
 */

"use client";

import { motion } from "framer-motion";
import styles from "@/styles/Earnings.module.css";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      when: "beforeChildren",
    },
  },
};

export function EarningsPageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      className={styles.page}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className={styles.container}>
        {children}
      </div>
    </motion.div>
  );
}

