"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ConfirmPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"verifying" | "verified" | "error">("verifying");
  const [countdown, setCountdown] = useState(3);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const supabase = createClient();
    let redirectTimer: NodeJS.Timeout;

    const handleVerificationSuccess = (userId: string) => {
      console.log("✅ User verified successfully:", userId);
      setStatus("verified");

      // Start countdown and redirect
      let count = 3;
      setCountdown(count);
      
      redirectTimer = setInterval(() => {
        count -= 1;
        setCountdown(count);
        
        if (count <= 0) {
          clearInterval(redirectTimer);
          console.log("Redirecting to signup for profile setup...");
          // Always redirect to signup - it will check if profile exists and redirect appropriately
          window.location.href = "/signup";
        }
      }, 1000);
    };

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth event:", event, session?.user?.email);

      if (event === "SIGNED_IN" && session?.user) {
        handleVerificationSuccess(session.user.id);
      } else if (event === "USER_UPDATED" && session?.user) {
        handleVerificationSuccess(session.user.id);
      }
    });

    // Also check immediately if there's already a session
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session error:", error);
          setErrorMessage("Could not verify your email. The link may have expired.");
          setStatus("error");
          return;
        }

        if (session?.user) {
          // Already signed in - verification was successful
          handleVerificationSuccess(session.user.id);
        } else {
          // No session yet, wait for auth state change
          // If nothing happens in 8 seconds, show error
          setTimeout(() => {
            if (status === "verifying") {
              console.error("Verification timeout - no session established");
              setErrorMessage("Verification is taking longer than expected. Please try signing in or request a new verification email.");
              setStatus("error");
            }
          }, 8000);
        }
      } catch (err) {
        console.error("Check session error:", err);
        setErrorMessage("An unexpected error occurred. Please try again.");
        setStatus("error");
      }
    };

    checkSession();

    // Cleanup
    return () => {
      subscription.unsubscribe();
      if (redirectTimer) {
        clearInterval(redirectTimer);
      }
    };
  }, [router, status]);

  const handleSignIn = () => {
    router.push("/signin");
  };

  const handleResendEmail = () => {
    router.push("/signup");
  };

  const handleContinue = () => {
    window.location.href = "/signup";
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-black">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              status === "verified" 
                ? "bg-green-500/20" 
                : status === "error"
                ? "bg-primary/20"
                : "bg-primary/10"
            }`}>
              {status === "verifying" && <Loader2 className="w-8 h-8 text-primary animate-spin" />}
              {status === "verified" && <CheckCircle className="w-8 h-8 text-green-400" />}
              {status === "error" && <XCircle className="w-8 h-8 text-primary" />}
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
            {status === "error" && (errorMessage || "This link may have expired or is invalid.")}
          </CardDescription>
        </CardHeader>

        {status === "verified" && (
          <CardContent className="space-y-3">
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <p className="text-sm text-center text-green-400">
                Your account has been successfully verified!
              </p>
            </div>
            <Button onClick={handleContinue} className="w-full">
              Continue to Setup
            </Button>
          </CardContent>
        )}

        {status === "error" && (
          <CardContent className="space-y-3">
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <p className="text-sm text-center text-primary">
                {errorMessage}
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSignIn} variant="outline" className="flex-1">
                Sign In
              </Button>
              <Button onClick={handleResendEmail} className="flex-1">
                Resend Email
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

