import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthHeading, FormSkeleton } from "@/features/auth/components/auth-heading";
import { LengkapiProfilForm } from "@/features/auth/components/lengkapi-profil-form";
import type { LengkapiProfilInput } from "@/features/auth/schemas";
import { prisma } from "@/lib/prisma";
import { requireUserPage } from "@/lib/rbac";
import { safeCallbackUrl } from "@/lib/safe-redirect";

export const metadata: Metadata = { title: "Lengkapi profil", robots: { index: false } };

async function ProfilContent({ searchParams }: { searchParams: PageProps<"/lengkapi-profil">["searchParams"] }) {
  const sp = await searchParams;
  const callbackUrl = safeCallbackUrl(sp.callbackUrl, "");
  const user = await requireUserPage("/lengkapi-profil");
  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  return (
    <>
      <AuthHeading title={`Halo, ${user.name.split(" ")[0]}`}>
        Lengkapi data berikut agar kami bisa menyarankan program yang sesuai target ujianmu.
      </AuthHeading>
      <LengkapiProfilForm
        callbackUrl={callbackUrl}
        defaults={{
          phone: profile?.phone ?? undefined,
          educationLevel: (profile?.educationLevel ?? undefined) as LengkapiProfilInput["educationLevel"] | undefined,
          examTarget: (profile?.examTarget ?? undefined) as LengkapiProfilInput["examTarget"] | undefined,
          school: profile?.school ?? undefined,
          city: profile?.city ?? undefined,
        }}
      />
    </>
  );
}

// Lengkapi profil (E.1.6).
export default function LengkapiProfilPage({ searchParams }: PageProps<"/lengkapi-profil">) {
  return (
    <Suspense fallback={<FormSkeleton fields={5} />}>
      <ProfilContent searchParams={searchParams} />
    </Suspense>
  );
}
