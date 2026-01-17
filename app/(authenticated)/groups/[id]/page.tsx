import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { MemberList } from "@/components/groups/member-list";
import { EmptyState } from "@/components/common/empty-state";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Settings, Users, Coins, TrendingUp } from "lucide-react";
import { connection } from "next/server";
import { cn } from "@/lib/utils";
import { formatCoins } from "@/lib/utils/calculations";
import { ResolvedBetsList } from "@/components/groups/resolved-bets-list";

async function GroupContent({ groupId, userId }: { groupId: string; userId: string }) {
  await connection();
  
  const supabase = await createClient();

  // Get group details
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("*")
    .eq("id", groupId)
    .single();

  if (groupError || !group) {
    redirect("/home");
  }

  // Verify user is a member and get their balance
  const { data: membership } = await supabase
    .from("group_members")
    .select("balance")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .single();

  if (!membership) {
    redirect("/home");
  }

  // Get all members with user details
  const { data: members } = await supabase
    .from("group_members")
    .select(`
      balance,
      users (
        id,
        username,
        display_name,
        avatar_url
      )
    `)
    .eq("group_id", groupId)
    .order("balance", { ascending: false });

  const formattedMembers = members?.map((m: any) => ({
    id: m.users.id,
    username: m.users.username,
    display_name: m.users.display_name,
    avatar_url: m.users.avatar_url,
    balance: m.balance,
    is_creator: m.users.id === group.created_by,
  })) || [];

  // Get active bets
  const { data: activeBets } = await supabase
    .from("markets")
    .select("*")
    .eq("group_id", groupId)
    .eq("status", "open")
    .order("created_at", { ascending: false });

  // Get resolved bets
  const { data: resolvedBets } = await supabase
    .from("markets")
    .select("*")
    .eq("group_id", groupId)
    .in("status", ["resolved", "cancelled"])
    .order("resolved_at", { ascending: false })
    .limit(10);

  return (
    <div className="space-y-6 p-4">
      {/* Balance Card */}
      <div className="bg-gradient-to-br from-primary to-red-600 text-white rounded-lg p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-red-100 text-sm mb-1">Your Balance</p>
            <p className={cn(
              "text-4xl font-bold",
              membership.balance < 0 && "text-yellow-300"
            )}>
              {formatCoins(membership.balance)}
            </p>
            <p className="text-red-100 text-sm mt-1">
              {membership.balance < 0 ? "in debt" : ""}
            </p>
          </div>
          <Coins className="w-16 h-16 text-red-300 opacity-50" />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card rounded-lg p-4 border border-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingUp className="w-4 h-4" />
            <p className="text-sm">Active Bets</p>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {activeBets?.length || 0}
          </p>
        </div>
        <div className="bg-card rounded-lg p-4 border border-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Users className="w-4 h-4" />
            <p className="text-sm">Members</p>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {formattedMembers.length}
          </p>
        </div>
      </div>

      {/* Active Bets Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            Active Bets
          </h2>
          <Button size="sm" asChild>
            <Link href={`/groups/${groupId}/bets/new`}>Create Bet</Link>
          </Button>
        </div>

        {!activeBets || activeBets.length === 0 ? (
          <EmptyState
            title="No active bets"
            description="Create a bet to get started!"
            action={{
              label: "Create Bet",
              href: `/groups/${groupId}/bets/new`,
            }}
          />
        ) : (
          <div className="space-y-3">
            {activeBets.map((bet: any) => (
              <Link
                key={bet.id}
                href={`/groups/${groupId}/bets/${bet.id}`}
                className="block"
              >
                <div className="bg-card rounded-lg p-4 border border-border hover:shadow-md transition-shadow">
                  <h3 className="font-medium text-foreground mb-2">{bet.title}</h3>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-green-600 font-medium">
                      Open
                    </span>
                    <span className="text-muted-foreground">
                      Pool: {formatCoins(bet.yes_pool + bet.no_pool)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Resolved Bets */}
      <ResolvedBetsList groupId={groupId} resolvedBets={resolvedBets || []} />

      {/* Members Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            Members ({formattedMembers.length})
          </h2>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/groups/${groupId}/invite`}>Invite</Link>
          </Button>
        </div>
        <MemberList members={formattedMembers} currentUserId={userId} />
      </div>

      {/* Settings */}
      {group.created_by === userId && (
        <div className="pt-4 border-t border-border">
          <Button variant="outline" className="w-full" asChild>
            <Link href={`/groups/${groupId}/settings`}>
              <Settings className="w-4 h-4 mr-2" />
              Group Settings
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}

async function GroupHeader({ groupId, userId }: { groupId: string; userId: string }) {
  await connection();
  
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("users")
    .select("display_name, avatar_url")
    .eq("id", userId)
    .single();

  // Get group name for header
  const { data: group } = await supabase
    .from("groups")
    .select("name")
    .eq("id", groupId)
    .single();

  return (
    <>
      <Header user={profile} />
      {group && (
        <div className="bg-card border-b border-border p-4">
          <h1 className="text-xl font-bold text-foreground">{group.name}</h1>
        </div>
      )}
    </>
  );
}

async function PageContent({ groupId }: { groupId: string }) {
  await connection();
  
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <>
      <Suspense fallback={<div className="h-16 bg-card border-b border-border" />}>
        <GroupHeader groupId={groupId} userId={user.id} />
      </Suspense>
      <Suspense fallback={<LoadingSpinner />}>
        <GroupContent groupId={groupId} userId={user.id} />
      </Suspense>
    </>
  );
}

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="min-h-screen">
      <Suspense fallback={<LoadingSpinner />}>
        <PageContent groupId={id} />
      </Suspense>
    </div>
  );
}

