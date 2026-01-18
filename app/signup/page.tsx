/**
 * Sign Up Page
 * Matches visual language of landing page
 */

import { SignupHeader } from "@/components/SignupHeader";
import { SignupForm } from "@/components/SignupForm";
import styles from "@/styles/Signup.module.css";

export default function SignupPage() {
  return (
    <main className={styles.page}>
      <div className={styles.content}>
        <SignupHeader />
        <SignupForm />
      </div>
    </main>
  );
}
