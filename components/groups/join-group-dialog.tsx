"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { joinGroup } from "@/lib/actions/groups";
import { useToast } from "@/hooks/use-toast";

interface JoinGroupDialogProps {
  trigger?: React.ReactNode;
  defaultCode?: string;
}

export function JoinGroupDialog({ trigger, defaultCode = "" }: JoinGroupDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(!!defaultCode);
  const [inviteCode, setInviteCode] = useState(defaultCode);
  const [isLoading, setIsLoading] = useState(false);

  // Listen for custom event from header button
  useEffect(() => {
    const handleOpenJoinGroup = () => setOpen(true);
    window.addEventListener("openJoinGroup", handleOpenJoinGroup);
    return () => window.removeEventListener("openJoinGroup", handleOpenJoinGroup);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await joinGroup(inviteCode.trim());

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else if (result.data) {
        toast({
          title: "Success!",
          description: "You've joined the group",
        });
        setOpen(false);
        setInviteCode("");
        router.push(`/groups/${result.data.id}`);
        router.refresh();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to join group",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join Group</DialogTitle>
          <DialogDescription>
            Enter a 6-character invite code to join a group
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="inviteCode">Invite Code</Label>
            <Input
              id="inviteCode"
              placeholder="ABC123"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              required
              minLength={6}
              maxLength={6}
              className="text-center text-2xl font-mono tracking-widest"
              autoFocus
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading || inviteCode.length !== 6}>
            {isLoading ? "Joining..." : "Join Group"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

