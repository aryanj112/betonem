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
import { PhoneInputComponent } from "@/components/auth/phone-input";
import { OTPInput } from "@/components/auth/otp-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import styles from "@/styles/Signup.module.css";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<"loading" | "signup" | "verify" | "verify-phone" | "profile">("loading");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [userId, setUserId] = useState("");
  const [otp, setOtp] = useState("");
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);

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
        setPhone(user.phone || "");
        setStep("profile");
      }
    } else {
      // Not authenticated, show signup form
      setStep("signup");
    }
  };

  const handleEmailSignup = async (data: { email: string; password: string; confirmPassword: string }) => {
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

  const handlePhoneSignup = async (phoneNumber: string) => {
    try {
      const supabase = createClient();
      
      const { error } = await supabase.auth.signInWithOtp({
        phone: phoneNumber,
        options: {
          channel: "sms",
        },
      });

      if (error) throw error;

      setPhone(phoneNumber);
      setStep("verify-phone");
    } catch (err: any) {
      throw err;
    }
  };

  const handlePhoneOTPVerification = async (otpCode: string) => {
    try {
      setIsVerifyingPhone(true);
      const supabase = createClient();
      
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phone,
        token: otpCode,
        type: "sms",
      });

      if (error) throw error;

      if (data.user) {
        setUserId(data.user.id);
        setStep("profile");
      }
    } catch (err: any) {
      throw err;
    } finally {
      setIsVerifyingPhone(false);
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

  if (step === "verify-phone") {
    return (
      <main className={styles.page}>
        <div className={styles.content}>
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Verify Your Phone</CardTitle>
              <CardDescription>
                We've sent a verification code to <strong>{phone}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <OTPInput
                  value={otp}
                  onChange={setOtp}
                  length={6}
                  onComplete={handlePhoneOTPVerification}
                  disabled={isVerifyingPhone}
                />
                <Button
                  onClick={() => handlePhoneOTPVerification(otp)}
                  disabled={otp.length !== 6 || isVerifyingPhone}
                  className="w-full"
                >
                  {isVerifyingPhone ? "Verifying..." : "Verify Code"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setOtp("");
                    setStep("signup");
                  }}
                  className="w-full"
                >
                  Change Phone Number
                </Button>
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
          <ProfileSetupForm userId={userId} email={email || undefined} phone={phone || undefined} />
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.content}>
        <SignupHeader />
        <Tabs defaultValue="email" className="w-full max-w-md">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="phone">Phone</TabsTrigger>
          </TabsList>
          <TabsContent value="email">
            <SignupForm onSubmit={handleEmailSignup} />
          </TabsContent>
          <TabsContent value="phone">
            <PhoneSignupForm onSubmit={handlePhoneSignup} />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

function PhoneSignupForm({ onSubmit }: { onSubmit: (phone: string) => Promise<void> }) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!phoneNumber || phoneNumber.length < 10) {
      setError("Please enter a valid phone number");
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(phoneNumber);
    } catch (err: any) {
      console.error("Phone signup error:", err);
      setError(err.message || "Failed to send verification code");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="phone" className="block text-sm font-medium mb-2">
          Phone Number
        </label>
        <PhoneInputComponent
          value={phoneNumber}
          onChange={setPhoneNumber}
          placeholder="+1 (555) 000-0000"
        />
      </div>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading || !phoneNumber}
      >
        {isLoading ? "Sending Code..." : "Send Verification Code"}
      </Button>
    </form>
  );
}
