"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Loader2 } from "lucide-react";

export default function ConfirmPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"verifying" | "verified" | "error">("verifying");
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const verifyEmail = async () => {
      const supabase = createClient();
      
      // Check if user is authenticated
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        setStatus("error");
        return;
      }

      // User is verified!
      setStatus("verified");

      // Check if user has profile
      const { data: profile } = await supabase
        .from("users")
        .select("id")
        .eq("id", user.id)
        .single();

      // Start countdown
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            // Redirect based on profile existence
            if (profile) {
              router.push("/home");
            } else {
              router.push("/signup"); // Will show profile setup
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    };

    verifyEmail();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-black">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              status === "verified" 
                ? "bg-green-500/20" 
                : status === "error"
                ? "bg-red-500/20"
                : "bg-primary/10"
            }`}>
              {status === "verifying" && <Loader2 className="w-8 h-8 text-primary animate-spin" />}
              {status === "verified" && <CheckCircle className="w-8 h-8 text-green-400" />}
              {status === "error" && <CheckCircle className="w-8 h-8 text-red-400" />}
            </div>
          </div>
          
          <CardTitle className="text-center">
            {status === "verifying" && "Verifying..."}
            {status === "verified" && "Email Verified!"}
            {status === "error" && "Verification Failed"}
          </CardTitle>
          
          <CardDescription className="text-center">
            {status === "verifying" && "Please wait while we verify your email..."}
            {status === "verified" && `Redirecting in ${countdown} seconds...`}
            {status === "error" && "This link may have expired or is invalid."}
          </CardDescription>
        </CardHeader>

        {status === "verified" && (
          <CardContent>
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <p className="text-sm text-center text-green-400">
                Your account has been successfully verified!
              </p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

