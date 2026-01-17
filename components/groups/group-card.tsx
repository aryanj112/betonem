import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface GroupCardProps {
  id: string;
  name: string;
  memberCount: number;
  balance: number;
  activeBetsCount?: number;
}

export function GroupCard({
  id,
  name,
  memberCount,
  balance,
  activeBetsCount = 0,
}: GroupCardProps) {
  return (
    <Link href={`/groups/${id}`}>
      <Card className="p-4 hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-lg text-white">{name}</h3>
            </div>
            
            <div className="space-y-1 text-sm text-gray-400">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{memberCount} member{memberCount !== 1 ? "s" : ""}</span>
              </div>
              
              {activeBetsCount > 0 && (
                <p className="text-gray-400">{activeBetsCount} active bet{activeBetsCount !== 1 ? "s" : ""}</p>
              )}
            </div>
          </div>

          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{balance}</p>
            <p className="text-xs text-gray-500">coins</p>
          </div>
        </div>
      </Card>
    </Link>
  );
}

