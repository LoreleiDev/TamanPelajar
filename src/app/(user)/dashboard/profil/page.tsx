import type { Metadata } from "next";
import { Suspense } from "react";

import { DashboardHeading, DashboardSection, DashboardSkeleton } from "@/components/shared/dashboard-parts";
import { PasswordForm, ProfilForm } from "@/features/dashboard/components/profile-forms";
import { getProfile } from "@/features/dashboard/queries";
import type { ProfilInput } from "@/features/dashboard/schemas";
import { requireUserPage } from "@/lib/rbac";

export const metadata: Metadata = { title: "Profil", robots: { index: false } };

async function Content() {
  const user = await requireUserPage("/dashboard/profil");
  const p = await getProfile(user.id);
  return (
    <>
      <DashboardHeading title="Profil">
        {p.accounts.some((a) => a.provider === "google") ? "Akun ini tertaut dengan Google." : "Data diri dan keamanan akun."}
      </DashboardHeading>
      <DashboardSection title="Data diri">
        <ProfilForm
          email={p.email}
          defaults={{
            name: p.name,
            phone: p.profile?.phone ?? "",
            educationLevel: (p.profile?.educationLevel ?? "") as ProfilInput["educationLevel"],
            examTarget: (p.profile?.examTarget ?? "") as ProfilInput["examTarget"],
            school: p.profile?.school ?? "",
            city: p.profile?.city ?? "",
          }}
        />
      </DashboardSection>
      <DashboardSection title={p.passwordHash ? "Ganti password" : "Buat password"}>
        <PasswordForm hasPassword={Boolean(p.passwordHash)} />
      </DashboardSection>
    </>
  );
}

// Profil (F.1).
export default function Page() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Content />
    </Suspense>
  );
}
