import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { AuthHeading, FormSkeleton, OrDivider } from "@/features/auth/components/auth-heading";
import { DaftarForm } from "@/features/auth/components/daftar-form";
import { GoogleButton } from "@/features/auth/components/google-button";
import { googleEnabled } from "@/lib/auth";
import { safeCallbackUrl } from "@/lib/safe-redirect";

export const metadata: Metadata = {
  title: "Daftar",
  description: "Buat akun Taman Pelajar gratis dan buka bab 1 dan 2 setiap kelas.",
};

async function DaftarContent({ searchParams }: { searchParams: PageProps<"/daftar">["searchParams"] }) {
  const sp = await searchParams;
  const callbackUrl = safeCallbackUrl(sp.callbackUrl, "");
  return (
    <>
      {googleEnabled && (
        <>
          <GoogleButton callbackUrl={callbackUrl || "/dashboard"} label="Daftar dengan Google" />
          <OrDivider />
        </>
      )}
      <DaftarForm callbackUrl={callbackUrl} />
      <p className="mt-8 text-center text-muted-foreground">
        Sudah punya akun?{" "}
        <Link
          href={callbackUrl ? `/masuk?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/masuk"}
          className="font-semibold text-primary underline underline-offset-4"
        >
          Masuk
        </Link>
      </p>
    </>
  );
}

// Halaman daftar (E.1.1, E.2).
export default function DaftarPage({ searchParams }: PageProps<"/daftar">) {
  return (
    <>
      <AuthHeading title="Buat akun">Gratis. Bab 1 dan 2 setiap kelas langsung terbuka setelah email diverifikasi.</AuthHeading>
      <Suspense fallback={<FormSkeleton fields={6} />}>
        <DaftarContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}
