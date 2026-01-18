/**
 * Sign In Page
 * Matches visual language of landing and signup pages
 */

"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SigninHeader } from "@/components/SigninHeader";
import { SigninForm } from "@/components/SigninForm";
import styles from "@/styles/Signin.module.css";

export default function SigninPage() {
  const router = useRouter();

  const handleSignin = async (data: { email: string; password: string }) => {
    try {
      const supabase = createClient();

      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (signInError) throw signInError;

      if (!authData.user) {
        throw new Error("No user returned after login");
      }

      // Check if user has profile
      const { data: profile } = await supabase
        .from("users")
        .select("id")
        .eq("id", authData.user.id)
        .single();

      if (profile) {
        router.push("/home");
        router.refresh();
      } else {
        // No profile, redirect to signup to complete profile
        router.push("/signup");
      }
    } catch (err: any) {
      throw err;
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.content}>
        <SigninHeader />
        <SigninForm onSubmit={handleSignin} />
      </div>
    </main>
  );
}
