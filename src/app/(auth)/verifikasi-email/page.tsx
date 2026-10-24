import { CircleCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { verifyEmailToken } from "@/features/auth/actions";
import { AuthHeading, FormSkeleton } from "@/features/auth/components/auth-heading";
import { EmailRequestForm } from "@/features/auth/components/email-request-form";
import { FormAlert } from "@/features/auth/components/form-parts";

export const metadata: Metadata = { title: "Verifikasi email", robots: { index: false } };

async function VerifyContent({ searchParams }: { searchParams: PageProps<"/verifikasi-email">["searchParams"] }) {
  const { token } = await searchParams;
  await connection(); // verifikasi memakai waktu saat ini dan mengubah database
  if (typeof token !== "string") {
    return (
      <>
        <AuthHeading title="Verifikasi email">
          Buka tautan yang kami kirim ke emailmu. Belum menerima? Kirim ulang tautannya.
        </AuthHeading>
        <EmailRequestForm mode="verify" />
      </>
    );
  }

  const result = await verifyEmailToken(token);
  if (!result.ok) {
    return (
      <>
        <AuthHeading title="Verifikasi gagal" />
        <div className="flex flex-col gap-6">
          <FormAlert message={result.error} />
          <EmailRequestForm mode="verify" />
        </div>
      </>
    );
  }
  return (
    <div className="flex flex-col gap-4" role="status">
      <CircleCheck className="size-10 text-primary" aria-hidden="true" />
      <h1 className="text-title text-primary">Email terverifikasi</h1>
      <p className="text-lead text-muted-foreground">
        <strong className="text-foreground">{result.data.email}</strong> sudah aktif. Masuk untuk mulai belajar.
      </p>
      <Button asChild size="lg">
        <Link href="/masuk">Masuk sekarang</Link>
      </Button>
    </div>
  );
}

// Verifikasi email (E.1.5).
export default function VerifikasiEmailPage({ searchParams }: PageProps<"/verifikasi-email">) {
  return (
    <Suspense fallback={<FormSkeleton fields={1} />}>
      <VerifyContent searchParams={searchParams} />
    </Suspense>
  );
}
