import type { Metadata } from "next";
import Link from "next/link";

import { AuthHeading } from "@/features/auth/components/auth-heading";
import { EmailRequestForm } from "@/features/auth/components/email-request-form";

export const metadata: Metadata = { title: "Lupa password", robots: { index: false } };

// Lupa password (E.1.3).
export default function LupaPasswordPage() {
  return (
    <>
      <AuthHeading title="Lupa password">
        Tulis email akunmu. Kami kirim tautan untuk membuat password baru.
      </AuthHeading>
      <EmailRequestForm mode="reset" />
      <p className="mt-8 text-center text-muted-foreground">
        Ingat password?{" "}
        <Link href="/masuk" className="font-semibold text-primary underline underline-offset-4">
          Masuk
        </Link>
      </p>
    </>
  );
}
