import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { ContactSettingsForm, FaqSettingsForm } from "@/components/admin/settings-forms";
import { contact } from "@/components/layout/nav-items";
import { DashboardHeading, DashboardSection, DashboardSkeleton } from "@/components/shared/dashboard-parts";
import { adminPage } from "@/features/admin/guard";
import { getSiteSettings } from "@/features/admin/site";

export const metadata: Metadata = { title: "Pengaturan", robots: { index: false } };

async function Content() {
  await adminPage("/admin/pengaturan");
  const s = await getSiteSettings();
  return (
    <>
      <DashboardSection
        title="FAQ beranda"
        action={
          <Link href="/#faq-judul" className="text-sm text-primary hover:underline">
            Lihat di beranda
          </Link>
        }
      >
        <FaqSettingsForm defaults={{ items: s.faq.length ? s.faq : [{ question: "", answer: "" }] }} />
      </DashboardSection>
      <DashboardSection
        title="Kontak"
        action={
          <Link href="/kontak" className="text-sm text-primary hover:underline">
            Lihat halaman kontak
          </Link>
        }
      >
        <ContactSettingsForm defaults={{ email: s.contact.email ?? contact.email, jamLayanan: s.contact.jamLayanan ?? "Senin–Jumat, 09.00–17.00 WIB" }} />
      </DashboardSection>
    </>
  );
}

// Pengaturan situs (M.1).
export default function AdminSettingsPage() {
  return (
    <>
      <DashboardHeading title="Pengaturan">Pertanyaan umum di beranda dan kontak layanan di halaman Hubungi kami.</DashboardHeading>
      <Suspense fallback={<DashboardSkeleton />}>
        <Content />
      </Suspense>
    </>
  );
}
