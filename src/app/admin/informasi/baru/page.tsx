import type { Metadata } from "next";
import { Suspense } from "react";

import { ArticleForm } from "@/components/admin/article-form";
import { DashboardHeading, DashboardSkeleton } from "@/components/shared/dashboard-parts";
import { Breadcrumb } from "@/components/shared/page-header";
import { adminPage } from "@/features/admin/guard";

export const metadata: Metadata = { title: "Tulis artikel", robots: { index: false } };

async function Content() {
  await adminPage("/admin/informasi/baru");
  return <ArticleForm cover={null} defaults={{ title: "", slug: "", excerpt: "", body: "", category: "ARTIKEL", coverId: null, status: "DRAF" }} />;
}

export default function NewArticlePage() {
  return (
    <>
      <Breadcrumb items={[{ label: "Informasi", href: "/admin/informasi" }, { label: "Tulis artikel" }]} />
      <DashboardHeading title="Tulis artikel" />
      <Suspense fallback={<DashboardSkeleton />}>
        <Content />
      </Suspense>
    </>
  );
}
