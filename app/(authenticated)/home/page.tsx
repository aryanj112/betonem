/**
 * Home Page - Dashboard view of active bets
 */

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HomeHeader } from "@/components/home/HomeHeader";
import { BetsGrid } from "@/components/home/BetsGrid";
import { GroupsList } from "@/components/home/GroupsList";
import { CreateBetDialog } from "@/components/home/CreateBetDialog";
import { CreateGroupDialog } from "@/components/groups/create-group-dialog";
import { JoinGroupDialog } from "@/components/groups/join-group-dialog-styled";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { connection } from "next/server";
import styles from "@/styles/Home.module.css";

async function BetsContent() {
  await connection();
  
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  // Get all groups the user is a member of with balance
  const { data: memberships } = await supabase
    .from("group_members")
    .select(`
      group_id,
      balance,
      groups (
        id,
        name,
        image_url
      )
    `)
    .eq("user_id", user.id);

  const groupIds = memberships?.map((m) => m.group_id) || [];
  
  // Transform into groups data
  const groups = memberships?.map((m: any) => ({
    id: m.groups.id,
    name: m.groups.name,
    image_url: m.groups.image_url,
    balance: m.balance,
  })) || [];

  if (groupIds.length === 0) {
    // No groups, show empty state
    return (
      <>
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#ffffff', marginBottom: '1.5rem' }}>
            Your Groups
          </h2>
          <GroupsList groups={[]} />
        </div>
        <BetsGrid bets={[]} />
      </>
    );
  }

  // Get all markets from user's groups with group information
  const { data: markets } = await supabase
    .from("markets")
    .select(`
      id,
      title,
      status,
      yes_pool,
      no_pool,
      lock_time,
      end_time,
      created_at,
      groups (
        id,
        name
      )
    `)
    .in("group_id", groupIds)
    .in("status", ["open", "locked", "resolved"])
    .order("created_at", { ascending: false })
    .limit(50);

  // Get user's bets for these markets
  const marketIds = markets?.map((m) => m.id) || [];
  const { data: userBets } = await supabase
    .from("bets")
    .select("market_id, position, amount")
    .eq("user_id", user.id)
    .in("market_id", marketIds);

  // Create a map of user bets for quick lookup
  const userBetsMap = new Map(
    userBets?.map((bet) => [bet.market_id, bet]) || []
  );

  // Transform markets into bet card format
  const bets = markets?.map((market: any) => {
    const totalPool = market.yes_pool + market.no_pool;
    const yesPercent = totalPool > 0 ? Math.round((market.yes_pool / totalPool) * 100) : 50;
    
    const userBet = userBetsMap.get(market.id);
    
    // Calculate time remaining
    let timeRemaining: string | undefined;
    if (market.status === "open") {
      const lockTime = new Date(market.lock_time);
      const now = new Date();
      const diffMs = lockTime.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays > 0) {
        timeRemaining = `${diffDays}d left`;
      } else {
        const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
        if (diffHours > 0) {
          timeRemaining = `${diffHours}h left`;
        } else {
          timeRemaining = "Closing soon";
        }
      }
    }

    // Map database status to display status
    let displayStatus: "OPEN" | "SETTLING" | "SETTLED";
    if (market.status === "open") {
      displayStatus = "OPEN";
    } else if (market.status === "locked") {
      displayStatus = "SETTLING";
    } else {
      displayStatus = "SETTLED";
    }

    return {
      id: market.id,
      title: market.title,
      poolAmount: totalPool,
      status: displayStatus,
      leanPercent: yesPercent,
      leaningSide: "YES" as const,
      groupName: market.groups?.name,
      groupId: market.groups?.id,
      timeRemaining,
      userPosition: userBet?.position,
      userAmount: userBet?.amount,
    };
  }) || [];

  return (
    <>
      {/* Groups Section */}
      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#ffffff', marginBottom: '1.5rem' }}>
          Your Groups
        </h2>
        <GroupsList groups={groups} />
      </div>

      {/* Bets Section */}
      <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#ffffff', marginBottom: '1.5rem' }}>
        Active Bets
      </h2>
      <BetsGrid bets={bets} />
    </>
  );
}

export default function HomePage() {
  return (
    <main className={styles.homePage}>
      <div className={styles.container}>
        <HomeHeader />
        <Suspense fallback={<LoadingSpinner />}>
          <BetsContent />
        </Suspense>
      </div>
      <CreateBetDialog />
      <CreateGroupDialog />
      <JoinGroupDialog />
    </main>
  );
}
