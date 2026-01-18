/**
 * Feature Callouts Row
 */

"use client";

import { motion } from "framer-motion";
import { Users, TrendingUp, DollarSign } from "lucide-react";
import styles from "@/styles/FeatureRow.module.css";

const features = [
  {
    icon: Users,
    title: "Private Groups",
    description: "Invite-only betting with your friends",
  },
  {
    icon: TrendingUp,
    title: "Real time odds",
    description: "Live market updates as bets flow in",
  },
  {
    icon: DollarSign,
    title: "Debt Based",
    description: "Start at $0, settle later",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

export function FeatureRow() {
  return (
    <motion.div
      className={styles.container}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
    >
      {features.map((feature) => {
        const Icon = feature.icon;
        return (
          <motion.div key={feature.title} className={styles.feature} variants={itemVariants}>
            <div className={styles.iconContainer}>
              <Icon className={styles.icon} />
            </div>
            <h3 className={styles.title}>{feature.title}</h3>
            <p className={styles.description}>{feature.description}</p>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
