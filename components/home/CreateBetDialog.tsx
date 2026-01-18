/**
 * Create Bet Dialog - Styled Version
 * Group Selector with Pink Theme and Pixelated Font
 */

"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Users, Plus, X } from "lucide-react";
import styles from "@/styles/Dialog.module.css";

interface Group {
  id: string;
  name: string;
  image_url?: string;
}

export function CreateBetDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Listen for custom event from header button
  useEffect(() => {
    const handleCreateBet = () => {
      setOpen(true);
      loadGroups();
    };
    window.addEventListener("openCreateBet", handleCreateBet);
    return () => window.removeEventListener("openCreateBet", handleCreateBet);
  }, []);

  const loadGroups = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: memberships } = await supabase
        .from("group_members")
        .select(`
          groups (
            id,
            name,
            image_url
          )
        `)
        .eq("user_id", user.id)
        .order("joined_at", { ascending: false });

      if (memberships) {
        setGroups(memberships.map((m: any) => m.groups).filter(Boolean));
      }
    } catch (error) {
      console.error("Error loading groups:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectGroup = (groupId: string) => {
    setOpen(false);
    router.push(`/groups/${groupId}/bets/new`);
  };

  const handleCreateGroup = () => {
    setOpen(false);
    // Trigger create group dialog
    window.dispatchEvent(new Event("openCreateGroup"));
  };

  const handleClose = () => {
    if (!isLoading) {
      setOpen(false);
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
                  Create <span className={styles.titleAccent}>Bet</span>
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
                Select a group to create your bet in
              </p>

              {/* Content */}
              <div className={styles.groupList}>
                {isLoading ? (
                  <div className={styles.loading}>
                    <div className={styles.spinner} />
                  </div>
                ) : groups.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p className={styles.emptyText}>
                      You need to be in a group to create bets
                    </p>
                    <button
                      onClick={handleCreateGroup}
                      className={styles.submitButton}
                    >
                      <Plus />
                      Create Your First Group
                    </button>
                  </div>
                ) : (
                  <>
                    {groups.map((group) => (
                      <motion.button
                        key={group.id}
                        onClick={() => handleSelectGroup(group.id)}
                        className={styles.groupCard}
                        whileHover={{ y: -2 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className={styles.groupIcon}>
                          {group.image_url ? (
                            <img
                              src={group.image_url}
                              alt={group.name}
                              className={styles.groupImage}
                            />
                          ) : (
                            <Users />
                          )}
                        </div>
                        <div className={styles.groupInfo}>
                          <h3 className={styles.groupName}>{group.name}</h3>
                          <p className={styles.groupHint}>Tap to create bet</p>
                        </div>
                      </motion.button>
                    ))}

                    {/* Create New Group Button */}
                    <div className={styles.divider} />
                    <button
                      onClick={handleCreateGroup}
                      className={styles.secondaryButton}
                    >
                      <Plus />
                      Create New Group
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
