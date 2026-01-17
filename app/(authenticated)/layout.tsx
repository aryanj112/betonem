import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Toaster } from "@/components/ui/toaster";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { connection } from "next/server";

async function AuthCheck() {
  // Tell Next.js this component needs dynamic data
  await connection();
  
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user has completed profile
  const { data: profile } = await supabase
    .from("users")
    .select("id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/signup");
  }

  return null;
}

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-black">
      <Suspense fallback={<LoadingSpinner />}>
        <AuthCheck />
      </Suspense>
      <main className="flex-1 pb-16">{children}</main>
      <BottomNav />
      <Toaster />
    </div>
  );
}

