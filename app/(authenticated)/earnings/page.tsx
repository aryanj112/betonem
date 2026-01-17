"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCoins } from "@/lib/utils/calculations";
import { formatDateTime } from "@/lib/utils/formatting";
import { TrendingUp, TrendingDown, Trophy, Award, Target } from "lucide-react";
import Link from "next/link";

export default function EarningsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [recentBets, setRecentBets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

    // Get all groups user is in
    const { data: memberships } = await supabase
      .from("group_members")
      .select("group_id, balance")
      .eq("user_id", user.id);

    const groupIds = memberships?.map((m) => m.group_id) || [];
    const totalBalance = memberships?.reduce((sum, m) => sum + m.balance, 0) || 0;

    // Get all resolved bets
    const { data: resolvedBetsData } = await supabase
      .from("bets")
      .select(`
        *,
        markets!inner (
          id,
          title,
          group_id,
          status,
          outcome,
          yes_pool,
          no_pool,
          resolved_at
        )
      `)
      .eq("user_id", user.id)
      .in("markets.group_id", groupIds)
      .eq("markets.status", "resolved")
      .order("markets.resolved_at", { ascending: false })
      .limit(20);

    const betsWithPayout = resolvedBetsData?.map((bet: any) => {
      const market = bet.markets;
      const totalPool = market.yes_pool + market.no_pool;
      const winningPool = market.outcome ? market.yes_pool : market.no_pool;
      const won = bet.position === market.outcome;
      const payout = won && winningPool > 0
        ? Math.floor((bet.amount / winningPool) * totalPool)
        : 0;
      const profit = won ? payout - bet.amount : -bet.amount;

      return {
        ...bet,
        market,
        won,
        payout,
        profit,
      };
    }) || [];

    // Calculate stats
    const totalBets = betsWithPayout.length;
    const wonBets = betsWithPayout.filter((b) => b.won).length;
    const totalWagered = betsWithPayout.reduce((sum, b) => sum + b.amount, 0);
    const totalProfit = betsWithPayout.reduce((sum, b) => sum + b.profit, 0);
    const winRate = totalBets > 0 ? (wonBets / totalBets) * 100 : 0;

    setStats({
      totalBalance,
      totalBets,
      wonBets,
      totalWagered,
      totalProfit,
      winRate,
    });

    setRecentBets(betsWithPayout);
    setIsLoading(false);
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={profile} />

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Your Earnings</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
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
              <CardDescription className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Total Bets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {stats?.totalBets || 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Award className="w-4 h-4" />
                Win Rate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {stats?.winRate.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">
                {stats?.wonBets}/{stats?.totalBets} wins
              </p>
            </CardContent>
          </Card>

          <Card className="col-span-2 md:col-span-3">
            <CardHeader className="pb-2">
              <CardDescription>Total Profit/Loss</CardDescription>
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-bold ${(stats?.totalProfit || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                {(stats?.totalProfit || 0) >= 0 ? "+" : ""}
                {formatCoins(stats?.totalProfit || 0)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Total wagered: {formatCoins(stats?.totalWagered || 0)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Bets */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Resolved Bets</CardTitle>
            <CardDescription>
              Your last 20 resolved bets across all groups
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentBets.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No resolved bets yet. Start betting to see your history!
              </p>
            ) : (
              recentBets.map((bet) => (
                <Link
                  key={bet.id}
                  href={`/groups/${bet.market.group_id}/bets/${bet.market.id}`}
                  className="block"
                >
                  <div className="flex items-start justify-between p-4 rounded-lg border border-border hover:border-primary transition-colors">
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground mb-1">
                        {bet.market.title}
                      </h3>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={bet.position ? "default" : "secondary"}>
                          {bet.position ? "YES" : "NO"}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatCoins(bet.amount)} wagered
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Resolved {formatDateTime(bet.market.resolved_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      {bet.won ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <TrendingUp className="w-4 h-4" />
                          <span className="font-bold">+{formatCoins(bet.profit)}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-red-600">
                          <TrendingDown className="w-4 h-4" />
                          <span className="font-bold">{formatCoins(bet.profit)}</span>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {bet.won ? "Won" : "Lost"}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

