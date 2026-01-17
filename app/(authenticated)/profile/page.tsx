"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import { Avatar } from "@/components/common/avatar";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, Users, Trophy, Target, TrendingUp } from "lucide-react";
import { formatCoins } from "@/lib/utils/calculations";

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
      router.push("/login");
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
    router.push("/login");
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={profile} />

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Profile Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <Avatar
                src={profile?.avatar_url}
                alt={profile?.display_name}
                fallback={profile?.display_name}
                size="xl"
              />
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {profile?.display_name}
                </h1>
                <p className="text-muted-foreground">@{profile?.username}</p>
                {profile?.venmo_username && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Venmo: {profile.venmo_username}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2 text-xs">
                <Users className="w-4 h-4" />
                Groups
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {stats?.totalGroups || 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2 text-xs">
                <Trophy className="w-4 h-4" />
                Total Balance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {formatCoins(stats?.totalBalance || 0)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2 text-xs">
                <Target className="w-4 h-4" />
                Total Bets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {stats?.totalBets || 0}
              </p>
              <p className="text-xs text-muted-foreground">
                {stats?.wonBets || 0} wins
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2 text-xs">
                <TrendingUp className="w-4 h-4" />
                Win Rate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {(stats?.winRate || 0).toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Lifetime Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Lifetime Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Total Wagered</span>
              <span className="font-semibold text-foreground">
                {formatCoins(stats?.totalWagered || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">Total Profit/Loss</span>
              <span className={`font-semibold ${(stats?.totalProfit || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                {(stats?.totalProfit || 0) >= 0 ? "+" : ""}
                {formatCoins(stats?.totalProfit || 0)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Email</span>
              <span className="text-sm text-foreground">
                {profile?.phone_number}
              </span>
            </div>
            
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleSignOut}
              disabled={isSigningOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              {isSigningOut ? "Signing out..." : "Sign Out"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

