/**
 * Home Header with Title and Action Buttons
 */

"use client";

import { motion } from "framer-motion";
import styles from "@/styles/Home.module.css";

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

export function HomeHeader() {
  const handleCreateClick = () => {
    // Trigger create bet dialog to show group selector
    window.dispatchEvent(new Event("openCreateBet"));
  };

  const handleJoinClick = () => {
    // Trigger join group dialog
    window.dispatchEvent(new Event("openJoinGroup"));
  };

  return (
    <motion.header
      className={styles.header}
      variants={headerVariants}
      initial="hidden"
      animate="visible"
    >
      <h1 className={styles.pageTitle}>
        Your <span className={styles.titleAccent}>Bets</span>
      </h1>
      
      <div className={styles.actionsContainer}>
        <button
          className={styles.actionButton}
          onClick={handleCreateClick}
          aria-label="Create a new bet"
        >
          Create
        </button>
        <button
          className={`${styles.actionButton} ${styles.actionButtonSecondary}`}
          onClick={handleJoinClick}
          aria-label="Join a group"
        >
          Join
        </button>
      </div>
    </motion.header>
  );
}
