import { Avatar } from "@/components/common/avatar";
import { formatCoins } from "@/lib/utils/calculations";

interface Bettor {
  user_id: string;
  display_name: string;
  username: string;
  avatar_url?: string | null;
  position: boolean;
  amount: number;
}

interface BettorsListProps {
  bettors: Bettor[];
  currentUserId: string;
}

export function BettorsList({ bettors, currentUserId }: BettorsListProps) {
  if (bettors.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No bets placed yet
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {bettors.map((bettor) => (
        <div
          key={bettor.user_id}
          className="flex items-center justify-between p-3 bg-card rounded-lg border border-border"
        >
          <div className="flex items-center gap-3">
            <Avatar
              src={bettor.avatar_url}
              alt={bettor.display_name}
              fallback={bettor.display_name}
              size="sm"
            />
            <div>
              <p className="font-medium text-sm text-foreground">
                {bettor.display_name}
                {bettor.user_id === currentUserId && (
                  <span className="text-xs text-muted-foreground ml-1">(You)</span>
                )}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-semibold text-sm">
              {formatCoins(bettor.amount)} on{" "}
              <span
                className={bettor.position ? "text-green-600" : "text-red-600"}
              >
                {bettor.position ? "YES" : "NO"}
              </span>
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

