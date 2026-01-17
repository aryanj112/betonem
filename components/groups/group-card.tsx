import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface GroupCardProps {
  id: string;
  name: string;
  imageUrl?: string | null;
  memberCount: number;
  balance: number;
  activeBetsCount?: number;
}

export function GroupCard({
  id,
  name,
  imageUrl,
  memberCount,
  balance,
  activeBetsCount = 0,
}: GroupCardProps) {
  return (
    <Link href={`/groups/${id}`}>
      <Card className="p-4 hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={name}
                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
            
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-white mb-2">{name}</h3>
              
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
          </div>

          <div className="text-right flex-shrink-0">
            <p className="text-2xl font-bold text-primary">{balance}</p>
            <p className="text-xs text-gray-500">coins</p>
          </div>
        </div>
      </Card>
    </Link>
  );
}

