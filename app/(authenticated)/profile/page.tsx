/**
 * Profile Page - Styled with Pink Theme and Pixelated Font
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { LogOut, Users, Trophy, Target, TrendingUp } from "lucide-react";
import { formatCoins } from "@/lib/utils/calculations";
import styles from "@/styles/Profile.module.css";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/signin");
      return;
    }

    // Get profile
    const { data: userProfile } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    setProfile(userProfile);

    // Get user's groups
    const { data: memberships } = await supabase
      .from("group_members")
      .select("group_id, balance")
      .eq("user_id", user.id);

    const groupIds = memberships?.map((m) => m.group_id) || [];
    const totalBalance = memberships?.reduce((sum, m) => sum + m.balance, 0) || 0;
    const totalGroups = groupIds.length;

    // Get betting stats
    const { data: allBets } = await supabase
      .from("bets")
      .select(`
        *,
        markets!inner (
          status,
          outcome,
          yes_pool,
          no_pool
        )
      `)
      .eq("user_id", user.id)
      .in("markets.group_id", groupIds);

    const resolvedBets = allBets?.filter((b: any) => b.markets.status === "resolved") || [];
    const wonBets = resolvedBets.filter((b: any) => b.position === b.markets.outcome);
    const totalWagered = resolvedBets.reduce((sum, b) => sum + b.amount, 0);
    
    const totalProfit = resolvedBets.reduce((sum, bet: any) => {
      const market = bet.markets;
      const totalPool = market.yes_pool + market.no_pool;
      const winningPool = market.outcome ? market.yes_pool : market.no_pool;
      const won = bet.position === market.outcome;
      const payout = won && winningPool > 0
        ? Math.floor((bet.amount / winningPool) * totalPool)
        : 0;
      return sum + (won ? payout - bet.amount : -bet.amount);
    }, 0);

    const winRate = resolvedBets.length > 0 
      ? (wonBets.length / resolvedBets.length) * 100 
      : 0;

    setStats({
      totalGroups,
      totalBalance,
      totalBets: resolvedBets.length,
      wonBets: wonBets.length,
      winRate,
      totalWagered,
      totalProfit,
    });

    setIsLoading(false);
  }

  async function handleSignOut() {
    setIsSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/signin");
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={styles.page}>
      <motion.div
        className={styles.container}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.header className={styles.header} variants={cardVariants}>
          <h1 className={styles.pageTitle}>
            Pro<span className={styles.titleAccent}>file</span>
          </h1>
        </motion.header>

        {/* Profile Card */}
        <motion.div className={styles.profileCard} variants={cardVariants}>
          <div className={styles.avatarContainer}>
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name}
                className={styles.avatar}
              />
            ) : (
              <div className={styles.avatarFallback}>
                {getInitials(profile?.display_name || "?")}
              </div>
            )}
          </div>
          <h2 className={styles.displayName}>{profile?.display_name}</h2>
          <p className={styles.username}>@{profile?.username}</p>
          {profile?.venmo_username && (
            <p className={styles.venmo}>Venmo: {profile.venmo_username}</p>
          )}
        </motion.div>

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          <motion.div className={styles.statCard} variants={cardVariants}>
            <div className={styles.statIcon}>
              <Users />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statLabel}>Groups</span>
              <span className={styles.statValue}>{stats?.totalGroups || 0}</span>
            </div>
          </motion.div>

          <motion.div className={styles.statCard} variants={cardVariants}>
            <div className={styles.statIcon}>
              <Trophy />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statLabel}>Balance</span>
              <span className={styles.statValue}>
                {formatCoins(stats?.totalBalance || 0)}
              </span>
            </div>
          </motion.div>

          <motion.div className={styles.statCard} variants={cardVariants}>
            <div className={styles.statIcon}>
              <Target />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statLabel}>Total Bets</span>
              <span className={styles.statValue}>{stats?.totalBets || 0}</span>
              <span className={styles.statSub}>{stats?.wonBets || 0} wins</span>
            </div>
          </motion.div>

          <motion.div className={styles.statCard} variants={cardVariants}>
            <div className={styles.statIcon}>
              <TrendingUp />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statLabel}>Win Rate</span>
              <span className={styles.statValue}>
                {(stats?.winRate || 0).toFixed(1)}%
              </span>
            </div>
          </motion.div>
        </div>

        {/* Lifetime Stats */}
        <motion.div className={styles.lifetimeCard} variants={cardVariants}>
          <h3 className={styles.sectionTitle}>
            Life<span className={styles.titleAccent}>time</span> Stats
          </h3>
          <div className={styles.lifetimeStats}>
            <div className={styles.lifetimeRow}>
              <span className={styles.lifetimeLabel}>Total Wagered</span>
              <span className={styles.lifetimeValue}>
                {formatCoins(stats?.totalWagered || 0)}
              </span>
            </div>
            <div className={styles.lifetimeRow}>
              <span className={styles.lifetimeLabel}>Total Profit/Loss</span>
              <span
                className={`${styles.lifetimeValue} ${
                  (stats?.totalProfit || 0) >= 0
                    ? styles.profit
                    : styles.loss
                }`}
              >
                {(stats?.totalProfit || 0) >= 0 ? "+" : ""}
                {formatCoins(stats?.totalProfit || 0)}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Account Section */}
        <motion.div className={styles.accountCard} variants={cardVariants}>
          <h3 className={styles.sectionTitle}>
            Acc<span className={styles.titleAccent}>ount</span>
          </h3>
          <div className={styles.accountInfo}>
            <div className={styles.accountRow}>
              <span className={styles.accountLabel}>Phone</span>
              <span className={styles.accountValue}>{profile?.phone_number}</span>
            </div>
          </div>
          <button
            className={styles.signOutButton}
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            <LogOut />
            {isSigningOut ? "Signing out..." : "Sign Out"}
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
