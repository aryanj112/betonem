/**
 * Sign Up Page
 * Matches visual language of landing page
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SignupHeader } from "@/components/SignupHeader";
import { SignupForm } from "@/components/SignupForm";
import { ProfileSetupForm } from "@/components/auth/profile-setup-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import styles from "@/styles/Signup.module.css";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<"loading" | "signup" | "verify" | "profile">("loading");
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // Check if user has profile
      const { data: profile } = await supabase
        .from("users")
        .select("id")
        .eq("id", user.id)
        .single();

      if (profile) {
        // Already has profile, redirect to home
        router.push("/home");
      } else {
        // Has auth but no profile, show profile setup
        setUserId(user.id);
        setEmail(user.email || "");
        setStep("profile");
      }
    } else {
      // Not authenticated, show signup form
      setStep("signup");
    }
  };

  const handleSignup = async (data: { email: string; password: string; confirmPassword: string }) => {
    try {
      const supabase = createClient();
      
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      });

      if (signUpError) throw signUpError;

      if (signUpData.user) {
        setEmail(data.email);
        setUserId(signUpData.user.id);
        
        // Check if email confirmation is required
        if (signUpData.user.identities && signUpData.user.identities.length === 0) {
          // Email already exists
          throw new Error("An account with this email already exists");
        }
        
        // Show verification step
        setStep("verify");
      }
    } catch (err: any) {
      throw err;
    }
  };

  if (step === "loading") {
    return (
      <main className={styles.page}>
        <div className={styles.content}>
          <LoadingSpinner />
        </div>
      </main>
    );
  }

  if (step === "verify") {
    return (
      <main className={styles.page}>
        <div className={styles.content}>
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Check Your Email</CardTitle>
              <CardDescription>
                We've sent a verification link to <strong>{email}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Click the link in the email to verify your account. After verifying, you'll be able to complete your profile.
              </p>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <p className="text-sm text-blue-400">
                  💡 Tip: Check your spam folder if you don't see the email within a few minutes.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  if (step === "profile") {
    return (
      <main className={styles.page}>
        <div className={styles.content} style={{ maxWidth: "600px" }}>
          <ProfileSetupForm userId={userId} email={email} />
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.content}>
        <SignupHeader />
        <SignupForm onSubmit={handleSignup} />
      </div>
    </main>
  );
}
