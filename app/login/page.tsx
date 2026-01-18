/**
 * Login redirect page
 * Redirects to /signin (the actual login page)
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/common/loading-spinner";

export default function LoginRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/signin");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <LoadingSpinner />
    </div>
  );
}

