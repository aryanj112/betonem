import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { InviteCode } from "@/components/groups/invite-code";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { connection } from "next/server";

async function InvitePageContent({ groupId }: { groupId: string }) {
  await connection();
  
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("users")
    .select("display_name, avatar_url")
    .eq("id", user.id)
    .single();

  // Get group details
  const { data: group, error } = await supabase
    .from("groups")
    .select("*")
    .eq("id", groupId)
    .single();

  if (error || !group) {
    redirect("/home");
  }

  // Verify user is a member
  const { data: membership } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    redirect("/home");
  }

  return (
    <>
      <Header user={profile} />
      
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <Button
          variant="ghost"
          asChild
          className="mb-4"
        >
          <Link href={`/groups/${groupId}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Group
          </Link>
        </Button>

        <div className="space-y-4">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Invite Friends</h1>
            <p className="text-muted-foreground">
              Share this code with friends to invite them to {group.name}
            </p>
          </div>

          <InviteCode code={group.invite_code} groupName={group.name} />

          <div className="pt-6 space-y-3">
            <p className="text-sm text-muted-foreground text-center">
              Friends can also join by entering the code on the home page
            </p>
            <div className="flex gap-3">
              <Button variant="outline" asChild className="flex-1">
                <Link href={`/groups/${groupId}`}>Done</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="min-h-screen">
      <Suspense fallback={<LoadingSpinner />}>
        <InvitePageContent groupId={id} />
      </Suspense>
    </div>
  );
}

