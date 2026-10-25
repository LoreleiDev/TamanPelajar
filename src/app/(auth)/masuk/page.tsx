import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { AuthHeading, FormSkeleton, OrDivider } from "@/features/auth/components/auth-heading";
import { GoogleButton } from "@/features/auth/components/google-button";
import { MasukForm } from "@/features/auth/components/masuk-form";
import { googleEnabled } from "@/lib/auth";
import { safeCallbackUrl } from "@/lib/safe-redirect";

export const metadata: Metadata = { title: "Masuk", robots: { index: false } };

// Pesan untuk ?error= dari Auth.js dan callback signIn.
const errorMessages: Record<string, string> = {
  google: "Akun Google ini belum memverifikasi emailnya. Coba akun lain atau daftar dengan email.",
  nonaktif: "Akun ini dinonaktifkan. Hubungi kami lewat halaman kontak.",
  OAuthAccountNotLinked: "Email ini sudah terdaftar dengan password. Masuk dengan email dan password.",
  AccessDenied: "Akses ditolak. Coba masuk lagi.",
  Configuration: "Login sedang bermasalah. Coba beberapa saat lagi.",
};

async function MasukContent({ searchParams }: { searchParams: PageProps<"/masuk">["searchParams"] }) {
  const sp = await searchParams;
  const callbackUrl = safeCallbackUrl(sp.callbackUrl, "");
  const error =
    typeof sp.error === "string"
      ? (errorMessages[sp.error] ?? "Gagal masuk. Coba lagi.")
      : sp.sesi === "berakhir"
        ? "Sesimu sudah tidak berlaku. Masuk lagi untuk melanjutkan."
        : undefined;
  const daftarHref = callbackUrl ? `/daftar?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/daftar";

  return (
    <>
      {googleEnabled && (
        <>
          <GoogleButton callbackUrl={callbackUrl || "/dashboard"} label="Masuk dengan Google" />
          <OrDivider />
        </>
      )}
      <MasukForm callbackUrl={callbackUrl} initialError={error} />
      <p className="mt-8 text-center text-muted-foreground">
        Belum punya akun?{" "}
        <Link href={daftarHref} className="font-semibold text-primary underline underline-offset-4">
          Daftar gratis
        </Link>
      </p>
    </>
  );
}

// Halaman masuk (E.1.2).
export default function MasukPage({ searchParams }: PageProps<"/masuk">) {
  return (
    <>
      <AuthHeading title="Masuk">Lanjutkan belajar dari materi dan tryout terakhirmu.</AuthHeading>
      <Suspense fallback={<FormSkeleton />}>
        <MasukContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}
