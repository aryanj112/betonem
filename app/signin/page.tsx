/**
 * Sign In Page
 * Matches visual language of landing and signup pages
 */

import { SigninHeader } from "@/components/SigninHeader";
import { SigninForm } from "@/components/SigninForm";
import styles from "@/styles/Signin.module.css";

export default function SigninPage() {
  return (
    <main className={styles.page}>
      <div className={styles.content}>
        <SigninHeader />
        <SigninForm />
      </div>
    </main>
  );
}
