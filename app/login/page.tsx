/**
 * Login Page
 * Matches visual language of landing and signup pages
 */

"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import styles from "@/styles/Login.module.css";
import headerStyles from "@/styles/SigninHeader.module.css";
import formStyles from "@/styles/SigninForm.module.css";

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

const formItemVariants = {
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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const supabase = createClient();

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      if (!data.user) {
        throw new Error("No user returned after login");
      }

      // Check if user has profile
      const { data: profile } = await supabase
        .from("users")
        .select("id")
        .eq("id", data.user.id)
        .single();

      if (profile) {
        router.push("/home");
        router.refresh();
      } else {
        // No profile, redirect to signup to complete profile
        router.push("/signup");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.content}>
        {/* Header */}
        <motion.div
          className={headerStyles.header}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1 className={headerStyles.headline} variants={itemVariants}>
            Enter your credentials
          </motion.h1>
          <motion.p className={headerStyles.subheadline} variants={itemVariants}>
            Let's make some quick bread
          </motion.p>
        </motion.div>

        {/* Form */}
        <motion.form
          className={formStyles.form}
          variants={formVariants}
          initial="hidden"
          animate="visible"
          onSubmit={handleLogin}
        >
          <motion.div className={formStyles.field} variants={formItemVariants}>
            <label htmlFor="email" className={formStyles.label}>
              Email
            </label>
            <input
              id="email"
              type="email"
              className={formStyles.input}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </motion.div>

          <motion.div className={formStyles.field} variants={formItemVariants}>
            <label htmlFor="password" className={formStyles.label}>
              Password
            </label>
            <input
              id="password"
              type="password"
              className={formStyles.input}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <Link href="/forgot-password" className={formStyles.forgotLink}>
              Forgot password?
            </Link>
          </motion.div>

          {error && (
            <motion.p className={formStyles.error} variants={formItemVariants}>
              {error}
            </motion.p>
          )}

          <motion.button
            type="submit"
            className={formStyles.submitButton}
            variants={formItemVariants}
            disabled={isLoading}
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </motion.button>

          <motion.p className={formStyles.signupLink} variants={formItemVariants}>
            Don't have an account?{" "}
            <Link href="/signup" className={formStyles.link}>
              Sign up
            </Link>
          </motion.p>
        </motion.form>
      </div>
    </main>
  );
}
