"use client";

import * as React from "react";
import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import { OddsDisplay } from "@/components/markets/odds-display";
import { PlaceBetModal } from "@/components/markets/place-bet-modal";
import { BettorsList } from "@/components/markets/bettors-list";
import { ResolveMarketCard } from "@/components/markets/resolve-market-card";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { Button } from "@/components/ui/button";
import { formatTimeUntil, formatDateTime, getMarketStatus } from "@/lib/utils/formatting";
import { formatCoins, calculatePayout } from "@/lib/utils/calculations";
import { ArrowLeft, Users, Coins, Trophy, Calendar } from "lucide-react";
import Link from "next/link";

export default function BetDetailPage({
  params,
}: {
  params: Promise<{ id: string; marketId: string }>;
}) {
  const { id: groupId, marketId } = use(params);
  const router = useRouter();
  const [market, setMarket] = useState<any>(null);
  const [userBets, setUserBets] = useState<any[]>([]);
  const [userBalance, setUserBalance] = useState(0);
  const [bettors, setBettors] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showBetModal, setShowBetModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // Add refresh key

  useEffect(() => {
    loadData();

    // Set up realtime subscription
    const supabase = createClient();
    const channel = supabase
      .channel(`market:${marketId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bets",
          filter: `market_id=eq.${marketId}`,
        },
        (payload) => {
          console.log("[Realtime] Bets changed:", payload);
          loadData();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "markets",
          filter: `id=eq.${marketId}`,
        },
        (payload) => {
          console.log("[Realtime] Market changed:", payload);
          loadData();
        }
      )
      .subscribe((status) => {
        console.log("[Realtime] Subscription status:", status);
      });

    return () => {
      channel.unsubscribe();
    };
  }, [marketId, refreshKey]);

  async function loadData() {
    const supabase = createClient();

    // Get current user
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      router.push("/login");
      return;
    }

    setUser(currentUser);

    // Get profile
    const { data: userProfile } = await supabase
      .from("users")
      .select("*")
      .eq("id", currentUser.id)
      .single();

    setProfile(userProfile);

    // Get market details
    const { data: marketData } = await supabase
      .from("markets")
      .select("*")
      .eq("id", marketId)
      .single();

    setMarket(marketData);

    // Get user's bets (all of them, not just one)
    const { data: betsData } = await supabase
      .from("bets")
      .select("*")
      .eq("market_id", marketId)
      .eq("user_id", currentUser.id)
      .order("created_at", { ascending: false });

    setUserBets(betsData || []);

    // Get user's balance
    const { data: membershipData } = await supabase
      .from("group_members")
      .select("balance")
      .eq("group_id", groupId)
      .eq("user_id", currentUser.id)
      .single();

    setUserBalance(membershipData?.balance || 0);

    // Get all bettors
    const { data: allBetsData } = await supabase
      .from("bets")
      .select(`
        *,
        users (
          id,
          display_name,
          username,
          avatar_url
        )
      `)
      .eq("market_id", marketId)
      .order("amount", { ascending: false });

    const formattedBettors = allBetsData?.map((b: any) => ({
      user_id: b.user_id,
      display_name: b.users.display_name,
      username: b.users.username,
      avatar_url: b.users.avatar_url,
      position: b.position,
      amount: b.amount,
    })) || [];

    setBettors(formattedBettors);
    setIsLoading(false);
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!market) {
    return <div>Market not found</div>;
  }

  const marketStatus = market.status;
  const totalPool = market.yes_pool + market.no_pool;

  // Calculate total user exposure and potential payout
  const userTotalBet = userBets.reduce((sum, bet) => sum + bet.amount, 0);
  const userYesBets = userBets.filter(bet => bet.position);
  const userNoBets = userBets.filter(bet => !bet.position);
  const userYesTotal = userYesBets.reduce((sum, bet) => sum + bet.amount, 0);
  const userNoTotal = userNoBets.reduce((sum, bet) => sum + bet.amount, 0);

  return (
    <div className="min-h-screen bg-background">
      <Header user={profile} />

      <div className="max-w-3xl mx-auto p-4 space-y-6">
        {/* Back Button */}
        <Button variant="ghost" asChild>
          <Link href={`/groups/${groupId}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Group
          </Link>
        </Button>

        {/* Market Card */}
        <div className="bg-card rounded-lg shadow-sm border border-border p-6 space-y-4">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {marketStatus === "open" && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                  Open
                </span>
              )}
              {marketStatus === "resolved" && market.outcome !== null && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary border border-primary/30">
                  Resolved
                </span>
              )}
              {marketStatus === "resolved" && market.outcome === null && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                  Cancelled
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              {formatDateTime(market.created_at)}
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-foreground">{market.title}</h1>

          {/* Description */}
          {market.description && (
            <p className="text-muted-foreground">{market.description}</p>
          )}
        </div>

        {/* Odds Display */}
        <div className="bg-card rounded-lg shadow-sm border border-border p-6 space-y-4">
          <h2 className="font-semibold text-foreground">Current Odds</h2>
          <OddsDisplay yesPool={market.yes_pool} noPool={market.no_pool} />

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Coins className="w-4 h-4" />
              <span>Total Pool: {formatCoins(totalPool)} coins</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>{bettors.length} bettor{bettors.length !== 1 ? "s" : ""}</span>
            </div>
          </div>
        </div>

        {/* User's Position */}
        {userBets.length > 0 ? (
          <div className="bg-card border border-primary rounded-lg p-6 space-y-4">
            <h2 className="font-semibold text-foreground">Your Bets ({userBets.length})</h2>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-border">
              <div>
                <p className="text-sm text-muted-foreground">YES Bets</p>
                <p className="text-lg font-bold text-green-400">{formatCoins(userYesTotal)}</p>
                <p className="text-xs text-muted-foreground">{userYesBets.length} bet{userYesBets.length !== 1 ? 's' : ''}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">NO Bets</p>
                <p className="text-lg font-bold text-red-400">{formatCoins(userNoTotal)}</p>
                <p className="text-xs text-muted-foreground">{userNoBets.length} bet{userNoBets.length !== 1 ? 's' : ''}</p>
              </div>
            </div>

            {/* Individual Bets */}
            <div className="space-y-2">
              {userBets.map((bet: any, index: number) => {
                const payout = calculatePayout(bet.amount, bet.position, market.yes_pool, market.no_pool);
                const profit = payout - bet.amount;

                return (
                  <div
                    key={bet.id}
                    className="bg-muted/50 rounded p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "font-bold text-sm px-2 py-1 rounded",
                        bet.position
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      )}>
                        {bet.position ? "YES" : "NO"}
                      </span>
                      <span className="font-bold">{formatCoins(bet.amount)}</span>
                    </div>
                    {marketStatus === "open" && (
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Potential</p>
                        <p className="text-sm font-medium text-foreground">
                          {formatCoins(payout)} <span className={profit > 0 ? "text-green-400" : "text-red-400"}>({profit > 0 ? '+' : ''}{formatCoins(profit)})</span>
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Place Another Bet Button */}
            {marketStatus === "open" && (
              <Button onClick={() => setShowBetModal(true)} className="w-full" variant="outline">
                Place Another Bet
              </Button>
            )}
          </div>
        ) : (
          marketStatus === "open" && (
            <Button onClick={() => setShowBetModal(true)} size="lg" className="w-full">
              Place Bet
            </Button>
          )
        )}

        {/* Resolve Market Card (only for creator when locked) */}
        <ResolveMarketCard
          marketId={marketId}
          groupId={groupId}
          title={market.title}
          isCreator={market.created_by === user?.id}
          status={marketStatus}
        />

        {/* Bettors List */}
        <div className="bg-card rounded-lg shadow-sm border border-border p-6 space-y-4">
          <h2 className="font-semibold text-foreground">
            Bettors ({bettors.length})
          </h2>
          <BettorsList bettors={bettors} currentUserId={user?.id || ""} />
        </div>
      </div>

      {/* Bet Modal */}
      <PlaceBetModal
        open={showBetModal}
        onOpenChange={(open) => {
          setShowBetModal(open);
          if (!open) {
            // Force reload data when modal closes
            console.log("[Modal] Closed - reloading data");
            setRefreshKey(prev => prev + 1);
            loadData();
          }
        }}
        marketId={marketId}
        yesPool={market.yes_pool}
        noPool={market.no_pool}
        userBalance={userBalance}
      />
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}

