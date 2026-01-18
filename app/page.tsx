/**
 * Landing Page
 * Main hero with animated content and floating bet cards
 */

import { Hero } from "@/components/Hero";
import { FeatureRow } from "@/components/FeatureRow";
import { FloatingBets } from "@/components/FloatingBets";
import styles from "@/styles/Landing.module.css";

export default function LandingPage() {
  return (
    <main className={styles.page}>
      <FloatingBets />
      <div className={styles.content}>
        <Hero />
        <FeatureRow />
      </div>
    </main>
  );
}
