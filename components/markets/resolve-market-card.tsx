"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Ban } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { resolveMarket } from "@/lib/actions/markets";

interface ResolveMarketCardProps {
  marketId: string;
  groupId: string;
  title: string;
  isCreator: boolean;
  status: string;
}

export function ResolveMarketCard({
  marketId,
  groupId,
  title,
  isCreator,
  status,
}: ResolveMarketCardProps) {
  const [isResolving, setIsResolving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  if (!isCreator || status !== "open") {
    return null;
  }

  const handleResolve = async (outcome: boolean | null) => {
    setIsResolving(true);

    try {
      const result = await resolveMarket(marketId, groupId, outcome);

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        const outcomeText = outcome === true ? "YES" : outcome === false ? "NO" : "CANCELLED";
        toast({
          title: "Market Resolved!",
          description: `The market has been resolved as ${outcomeText}`,
        });
        // Navigate back to home page
        router.push("/home");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resolve market",
        variant: "destructive",
      });
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <Card className="border-primary bg-card">
      <CardHeader>
        <CardTitle className="text-foreground">Resolve Market</CardTitle>
        <CardDescription className="text-muted-foreground">
          As the creator, you can now resolve this market. Choose the winning outcome.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          onClick={() => handleResolve(true)}
          disabled={isResolving}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
          size="lg"
        >
          <CheckCircle2 className="w-5 h-5 mr-2" />
          Resolve as YES
        </Button>
        
        <Button
          onClick={() => handleResolve(false)}
          disabled={isResolving}
          className="w-full bg-red-600 hover:bg-red-700 text-white"
          size="lg"
        >
          <XCircle className="w-5 h-5 mr-2" />
          Resolve as NO
        </Button>
        
        <Button
          onClick={() => handleResolve(null)}
          disabled={isResolving}
          variant="outline"
          className="w-full"
          size="lg"
        >
          <Ban className="w-5 h-5 mr-2" />
          Cancel Market (Refund All)
        </Button>

        <p className="text-xs text-muted-foreground text-center pt-2">
          This action cannot be undone. Payouts will be distributed immediately.
        </p>
      </CardContent>
    </Card>
  );
}

