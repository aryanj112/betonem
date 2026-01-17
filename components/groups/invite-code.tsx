"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Share2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InviteCodeProps {
  code: string;
  groupName: string;
}

export function InviteCode({ code, groupName }: InviteCodeProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const shareUrl = `${appUrl}/join/${code}`;
  const shareText = `Join my group "${groupName}" on BetOnEm! Code: ${code} - ${shareUrl}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Invite code copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy code",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${groupName} on BetOnEm`,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled share or error occurred
        console.error("Share error:", err);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareText);
        toast({
          title: "Copied!",
          description: "Invite link copied to clipboard",
        });
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to share",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-8 text-center space-y-4">
      <h3 className="text-sm font-medium text-gray-700">Your invite code</h3>
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <p className="text-4xl font-bold text-primary tracking-widest font-mono">
          {code}
        </p>
      </div>
      <div className="flex gap-3 justify-center">
        <Button onClick={handleCopy} variant="outline" className="flex-1 max-w-[150px]">
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </>
          )}
        </Button>
        <Button onClick={handleShare} className="flex-1 max-w-[150px]">
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
      </div>
    </div>
  );
}

