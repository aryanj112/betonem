import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { GroupCard } from "@/components/groups/group-card";
import { EmptyGroupsState } from "@/components/common/empty-groups-state";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { CreateGroupDialog } from "@/components/groups/create-group-dialog";
import { JoinGroupDialog } from "@/components/groups/join-group-dialog";
import { connection } from "next/server";

async function GroupsList() {
  await connection();
  
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/signup");
  }

  // Get user's groups with member data
  const { data: groupMemberships } = await supabase
    .from("group_members")
    .select(`
      balance,
      groups (
        id,
        name,
        invite_code,
        created_by,
        created_at
      )
    `)
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false });

  // Get member counts for each group
  const groupIds = groupMemberships?.map((gm: any) => gm.groups.id) || [];
  const { data: memberCounts } = await supabase
    .from("group_members")
    .select("group_id")
    .in("group_id", groupIds);

  // Count members per group
  const memberCountMap: Record<string, number> = {};
  memberCounts?.forEach((mc: any) => {
    memberCountMap[mc.group_id] = (memberCountMap[mc.group_id] || 0) + 1;
  });

  // Get active bets count for each group
  const { data: activeBets } = await supabase
    .from("markets")
    .select("group_id")
    .in("group_id", groupIds)
    .in("status", ["open", "locked"]);

  // Count active bets per group
  const activeBetsMap: Record<string, number> = {};
  activeBets?.forEach((bet: any) => {
    activeBetsMap[bet.group_id] = (activeBetsMap[bet.group_id] || 0) + 1;
  });

  const groups = groupMemberships?.map((gm: any) => ({
    ...gm.groups,
    balance: gm.balance,
    memberCount: memberCountMap[gm.groups.id] || 1,
    activeBetsCount: activeBetsMap[gm.groups.id] || 0,
  }));

  if (!groups || groups.length === 0) {
    return <EmptyGroupsState />;
  }

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-lg font-semibold text-foreground">Your Groups</h2>
      {groups.map((group: any) => (
        <GroupCard
          key={group.id}
          id={group.id}
          name={group.name}
          memberCount={group.memberCount}
          balance={group.balance}
          activeBetsCount={group.activeBetsCount}
        />
      ))}
    </div>
  );
}

async function HeaderSection() {
  await connection();
  
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("display_name, avatar_url")
    .eq("id", user.id)
    .single();

  return <Header user={profile} showCreateButton showJoinButton />;
}

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Suspense fallback={<div className="h-16 bg-card border-b border-border" />}>
        <HeaderSection />
      </Suspense>
      <Suspense fallback={<LoadingSpinner />}>
        <GroupsList />
      </Suspense>
      <CreateGroupDialog />
      <JoinGroupDialog />
    </div>
  );
}

