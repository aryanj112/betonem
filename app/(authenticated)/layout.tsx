import { Suspense } from "react";
import dynamic from "next/dynamic";
import { unstable_noStore } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Toaster } from "@/components/ui/toaster";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { connection } from "next/server";

const BottomNav = dynamic(
  () => import("@/components/layout/bottom-nav").then((mod) => ({ default: mod.BottomNav })),
  { ssr: false }
);

async function AuthCheck() {
  // Tell Next.js this component needs dynamic data
  unstable_noStore();
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

// Mark this layout as dynamic to prevent prerendering issues
export const dynamic = 'force-dynamic';

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
      <Suspense fallback={null}>
        <BottomNav />
      </Suspense>
      <Toaster />
    </div>
  );
}

