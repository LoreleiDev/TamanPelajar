import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ArticleForm } from "@/components/admin/article-form";
import { DashboardHeading, DashboardSkeleton } from "@/components/shared/dashboard-parts";
import { Breadcrumb } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { adminPage } from "@/features/admin/guard";
import { getAdminArticle } from "@/features/article/queries";
import { formatTanggalJam } from "@/lib/format";

export const metadata: Metadata = { title: "Ubah artikel", robots: { index: false } };

async function Content({ params }: { params: PageProps<"/admin/informasi/[id]">["params"] }) {
  const { id } = await params;
  await adminPage(`/admin/informasi/${id}`);
  const a = await getAdminArticle(id);
  if (!a) notFound();
  return (
    <>
      <Breadcrumb items={[{ label: "Informasi", href: "/admin/informasi" }, { label: a.title }]} />
      <DashboardHeading
        title={a.title}
        action={
          a.status === "TERBIT" ? (
            <Button asChild variant="outline">
              <Link href={`/informasi/${a.slug}`}>
                <ExternalLink data-icon="inline-start" />
                Halaman publik
              </Link>
            </Button>
          ) : undefined
        }
      >
        Ditulis {a.author.name}
        {a.publishedAt ? `, terbit ${formatTanggalJam(a.publishedAt)}` : ", belum terbit"}
      </DashboardHeading>
      <ArticleForm
        cover={a.coverId && a.coverUrl ? { id: a.coverId, url: a.coverUrl, name: "Sampul" } : null}
        defaults={{ id: a.id, title: a.title, slug: a.slug, excerpt: a.excerpt, body: a.body, category: a.category, coverId: a.coverId, status: a.status }}
      />
    </>
  );
}

export default function EditArticlePage({ params }: PageProps<"/admin/informasi/[id]">) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}
