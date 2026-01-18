/**
 * Sign Up Form Component
 * Form with animated inputs matching landing page style
 */

"use client";

import { useState, FormEvent } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import styles from "@/styles/SignupForm.module.css";

const formVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

interface SignupFormProps {
  onSubmit?: (data: { email: string; password: string; confirmPassword: string }) => void;
}

export function SignupForm({ onSubmit }: SignupFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    try {
      if (onSubmit) {
        await onSubmit({ email, password, confirmPassword });
      } else {
        // Default behavior - you can connect this to your auth system
        console.log("Sign up:", { email, password });
        setError("No submit handler configured");
      }
    } catch (err: any) {
      console.error("Signup error:", err);
      setError(err.message || "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.form
      className={styles.form}
      variants={formVariants}
      initial="hidden"
      animate="visible"
      onSubmit={handleSubmit}
    >
      <motion.div className={styles.field} variants={itemVariants}>
        <label htmlFor="email" className={styles.label}>
          Email
        </label>
        <input
          id="email"
          type="email"
          className={styles.input}
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </motion.div>

      <motion.div className={styles.field} variants={itemVariants}>
        <label htmlFor="password" className={styles.label}>
          Password
        </label>
        <input
          id="password"
          type="password"
          className={styles.input}
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
        />
      </motion.div>

      <motion.div className={styles.field} variants={itemVariants}>
        <label htmlFor="confirmPassword" className={styles.label}>
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          type="password"
          className={styles.input}
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
        />
      </motion.div>

      {error && (
        <motion.p className={styles.error} variants={itemVariants}>
          {error}
        </motion.p>
      )}

      <motion.button
        type="submit"
        className={styles.submitButton}
        variants={itemVariants}
        disabled={isLoading}
      >
        {isLoading ? "Creating Account..." : "Create Account"}
      </motion.button>

      <motion.p className={styles.loginLink} variants={itemVariants}>
        Already have an account?{" "}
        <Link href="/signin" className={styles.link}>
          Log in
        </Link>
      </motion.p>
    </motion.form>
  );
}
