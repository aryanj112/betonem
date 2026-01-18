/**
 * Sign In Form Component
 * Form with animated inputs matching landing page style
 */

"use client";

import { useState, FormEvent } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import styles from "@/styles/SigninForm.module.css";

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

interface SigninFormProps {
  onSubmit?: (data: { email: string; password: string }) => void;
}

export function SigninForm({ onSubmit }: SigninFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    setIsLoading(true);
    try {
      if (onSubmit) {
        await onSubmit({ email, password });
      } else {
        // Default behavior - you can connect this to your auth system
        console.log("Sign in:", { email });
        setError("No submit handler configured");
      }
    } catch (err: any) {
      console.error("Signin error:", err);
      setError(err.message || "Invalid email or password");
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
          autoComplete="current-password"
        />
        <Link href="/forgot-password" className={styles.forgotLink}>
          Forgot password?
        </Link>
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
        {isLoading ? "Signing In..." : "Sign In"}
      </motion.button>

      <motion.p className={styles.signupLink} variants={itemVariants}>
        Don't have an account?{" "}
        <Link href="/signup" className={styles.link}>
          Sign up
        </Link>
      </motion.p>
    </motion.form>
  );
}
