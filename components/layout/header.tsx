"use client";

import { Plus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/common/avatar";
import Link from "next/link";

interface HeaderProps {
  user?: {
    display_name: string;
    avatar_url?: string | null;
  } | null;
  showCreateButton?: boolean;
  showJoinButton?: boolean;
  onCreateClick?: () => void;
  onJoinClick?: () => void;
}

export function Header({ 
  user, 
  showCreateButton = false, 
  showJoinButton = false,
  onCreateClick,
  onJoinClick 
}: HeaderProps) {
  const handleCreateClick = () => {
    if (onCreateClick) {
      onCreateClick();
    } else {
      // Dispatch custom event for CreateGroupDialog to listen to
      window.dispatchEvent(new Event("openCreateGroup"));
    }
  };

  const handleJoinClick = () => {
    if (onJoinClick) {
      onJoinClick();
    } else {
      // Dispatch custom event for JoinGroupDialog to listen to
      window.dispatchEvent(new Event("openJoinGroup"));
    }
  };

  return (
    <header className="sticky top-0 bg-black border-b border-gray-900 z-40 pt-safe">
      <div className="flex items-center justify-between h-16 px-4">
        <Link href="/home" className="text-xl font-bold text-white">
          Bet<span className="text-primary">On</span>Em
        </Link>

        <div className="flex items-center gap-3">
          {showJoinButton && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleJoinClick}
              className="rounded-full"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Join
            </Button>
          )}
          
          {showCreateButton && (
            <Button
              size="sm"
              onClick={handleCreateClick}
              className="rounded-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create
            </Button>
          )}

          {user && (
            <Link href="/profile">
              <Avatar
                src={user.avatar_url}
                alt={user.display_name}
                fallback={user.display_name}
                size="md"
              />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

