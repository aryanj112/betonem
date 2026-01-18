/**
 * Hero Section with Animated Headline and CTA
 */

"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import styles from "@/styles/Hero.module.css";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3,
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

export function Hero() {
  return (
    <motion.div
      className={styles.hero}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h1 className={styles.headline} variants={itemVariants}>
        Bet<span className={styles.headlineAccent}>On</span>Em
      </motion.h1>
      
      <motion.p className={styles.subheadline} variants={itemVariants}>
        Prediction markets with friends. Make friendly bets on real-life events.
      </motion.p>
      
      <motion.div className={styles.ctaContainer} variants={itemVariants}>
        <Link href="/signup" className={styles.primaryButton}>
          Get Started
          <ArrowRight className={styles.buttonIcon} />
        </Link>
        <Link href="/login" className={styles.secondaryButton}>
          Sign In
        </Link>
      </motion.div>
    </motion.div>
  );
}
