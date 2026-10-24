import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { AuthHeading, FormSkeleton } from "@/features/auth/components/auth-heading";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/tokens";

export const metadata: Metadata = { title: "Buat password baru", robots: { index: false } };

async function ResetContent({ params }: { params: PageProps<"/reset-password/[token]">["params"] }) {
  const { token } = await params;
  await connection(); // memeriksa kedaluwarsa token dengan waktu saat ini
  const row = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!row || row.usedAt || row.expiresAt < new Date()) {
    return (
      <div className="flex flex-col gap-4" role="alert">
        <p>Tautan ini sudah kedaluwarsa atau sudah dipakai. Tautan reset berlaku 1 jam dan hanya untuk sekali pakai.</p>
        <Button asChild size="lg">
          <Link href="/lupa-password">Minta tautan baru</Link>
        </Button>
      </div>
    );
  }
  return <ResetPasswordForm token={token} />;
}

// Reset password (E.1.4).
export default function ResetPasswordPage({ params }: PageProps<"/reset-password/[token]">) {
  return (
    <>
      <AuthHeading title="Buat password baru" />
      <Suspense fallback={<FormSkeleton />}>
        <ResetContent params={params} />
      </Suspense>
    </>
  );
}
