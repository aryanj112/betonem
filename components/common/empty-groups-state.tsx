"use client";

import { EmptyState } from "./empty-state";
import { Users } from "lucide-react";

export function EmptyGroupsState() {
  return (
    <EmptyState
      icon={Users}
      title="No groups yet!"
      description="Join friends or create your own group to start betting"
      action={{
        label: "Join Group",
        onClick: () => window.dispatchEvent(new Event("openJoinGroup")),
      }}
      secondaryAction={{
        label: "Create Group",
        onClick: () => window.dispatchEvent(new Event("openCreateGroup")),
      }}
    />
  );
}

