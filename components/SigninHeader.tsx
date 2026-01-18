/**
 * Sign In Header Component
 * Animated header matching landing page style
 */

"use client";

import { motion } from "framer-motion";
import styles from "@/styles/SigninHeader.module.css";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    scale: 1.1,
    filter: "blur(4px)",
  },
  visible: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94], // easeOutQuad
    },
  },
};

export function SigninHeader() {
  return (
    <motion.div
      className={styles.header}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h1 className={styles.headline} variants={itemVariants}>
        Enter your credentials
      </motion.h1>
      <motion.p className={styles.subheadline} variants={itemVariants}>
        Let's make some quick bread
      </motion.p>
    </motion.div>
  );
}
