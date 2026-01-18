/**
 * Join Group Dialog - Styled for Home Page
 * Matches dark theme with pink accents and pixelated font
 */

"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { joinGroup } from "@/lib/actions/groups";
import { X } from "lucide-react";
import styles from "@/styles/Dialog.module.css";

export function JoinGroupDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Listen for custom event from header button
  useEffect(() => {
    const handleOpenJoinGroup = () => {
      setOpen(true);
      setError("");
      setSuccess("");
    };
    window.addEventListener("openJoinGroup", handleOpenJoinGroup);
    return () => window.removeEventListener("openJoinGroup", handleOpenJoinGroup);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await joinGroup(inviteCode.trim());

      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        setSuccess("You've joined the group!");
        setTimeout(() => {
          setOpen(false);
          setInviteCode("");
          router.push(`/groups/${result.data.id}`);
          router.refresh();
        }, 1000);
      }
    } catch (error) {
      setError("Failed to join group");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setOpen(false);
      setInviteCode("");
      setError("");
      setSuccess("");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Dialog */}
          <motion.div
            className={styles.dialogContainer}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            <div className={styles.dialog}>
              {/* Header */}
              <div className={styles.header}>
                <h2 className={styles.title}>
                  Join <span className={styles.titleAccent}>Group</span>
                </h2>
                <button
                  className={styles.closeButton}
                  onClick={handleClose}
                  aria-label="Close"
                  disabled={isLoading}
                >
                  <X />
                </button>
              </div>

              <p className={styles.description}>
                Enter a 6-character invite code
              </p>

              {/* Form */}
              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.inputGroup}>
                  <label htmlFor="inviteCode" className={styles.label}>
                    Invite Code
                  </label>
                  <input
                    id="inviteCode"
                    type="text"
                    placeholder="ABC123"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    className={styles.input}
                    required
                    minLength={6}
                    maxLength={6}
                    autoFocus
                    disabled={isLoading}
                  />
                </div>

                {error && (
                  <motion.div
                    className={styles.error}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {error}
                  </motion.div>
                )}

                {success && (
                  <motion.div
                    className={styles.success}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {success}
                  </motion.div>
                )}

                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={isLoading || inviteCode.length !== 6}
                >
                  {isLoading ? "Joining..." : "Join Group"}
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

