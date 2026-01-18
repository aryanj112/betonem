import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { JoinGroupDialog } from "@/components/groups/join-group-dialog";
import { Header } from "@/components/layout/header";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { connection } from "next/server";

async function JoinPageContent({ code }: { code: string }) {
  await connection();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/join/${code}`);
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("users")
    .select("display_name, avatar_url")
    .eq("id", user.id)
    .single();

  // Verify the invite code exists
  const { data: group } = await supabase
    .from("groups")
    .select("name")
    .eq("invite_code", code.toUpperCase())
    .single();

  return (
    <>
      <Header user={profile} />
      <div className="max-w-md mx-auto p-6 space-y-6">
        {group ? (
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-foreground">
              Join {group.name}?
            </h1>
            <p className="text-muted-foreground">
              You&apos;ve been invited to join this group
            </p>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-foreground">
              Join a Group
            </h1>
            <p className="text-muted-foreground">
              Enter the invite code to join
            </p>
          </div>
        )}

        <JoinGroupDialog defaultCode={code.toUpperCase()} />
      </div>
    </>
  );
}

export default async function JoinWithCodePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return (
    <div className="min-h-screen">
      <Suspense fallback={<LoadingSpinner />}>
        <JoinPageContent code={code} />
      </Suspense>
    </div>
  );
}

