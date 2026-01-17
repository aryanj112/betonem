"use client";

import { JoinGroupDialog } from "@/components/groups/join-group-dialog";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";

export default function JoinPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="flex items-center justify-center p-6">
        <JoinGroupDialog 
          trigger={
            <Button size="lg">
              Enter Invite Code
            </Button>
          }
        />
      </div>
    </div>
  );
}

