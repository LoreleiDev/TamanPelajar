import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ProductForm } from "@/components/admin/product-form";
import { DashboardHeading, DashboardSkeleton } from "@/components/shared/dashboard-parts";
import { Breadcrumb } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { getExamCategories } from "@/features/admin/exams/queries";
import { adminPage } from "@/features/admin/guard";
import { publishLabel, publishTone } from "@/features/admin/labels";
import { getAdminProduct, getProductContentOptions } from "@/features/admin/products/queries";

export const metadata: Metadata = { title: "Ubah paket", robots: { index: false } };

async function Content({ params }: { params: PageProps<"/admin/produk/[id]">["params"] }) {
  const { id } = await params;
  await adminPage(`/admin/produk/${id}`);
  const [p, categories, options] = await Promise.all([getAdminProduct(id), getExamCategories(), getProductContentOptions()]);
  if (!p) notFound();
  // Video yang sudah termasuk tetap tampil walau kini menjadi bagian kelas.
  const videoIds = p.videos.map((v) => v.videoId);
  const faq = Array.isArray(p.faq) ? (p.faq as { question: string; answer: string }[]) : [];

  return (
    <>
      <Breadcrumb items={[{ label: "Paket produk", href: "/admin/produk" }, { label: p.name }]} />
      <DashboardHeading
        title={p.name}
        action={
          p.status === "TERBIT" ? (
            <Button asChild variant="outline">
              <Link href={`/paket/${p.slug}`}>
                <ExternalLink data-icon="inline-start" />
                Halaman publik
              </Link>
            </Button>
          ) : undefined
        }
      >
        Terjual {p.salesCount}, {p._count.enrollments} siswa aktif
      </DashboardHeading>
      <StatusBadge tone={publishTone[p.status]} variant="box">
        {publishLabel[p.status]}
      </StatusBadge>
      <ProductForm
        categories={categories}
        options={{
          ...options,
          videos: [...options.videos, ...videoIds.filter((v) => !options.videos.some((o) => o.id === v)).map((v) => ({ id: v, label: "Video (bagian kelas)", hint: "Termasuk sebelumnya" }))],
        }}
        thumbnail={p.thumbnailId && p.thumbnailUrl ? { id: p.thumbnailId, url: p.thumbnailUrl, name: "Thumbnail" } : null}
        defaults={{
          id: p.id,
          name: p.name,
          slug: p.slug,
          categoryId: p.categoryId,
          programType: p.programType,
          educationLevel: p.educationLevel,
          summary: p.summary,
          description: p.description,
          thumbnailId: p.thumbnailId,
          price: String(p.price),
          promoPrice: p.promoPrice === null ? "" : String(p.promoPrice),
          activeDays: String(p.activeDays),
          features: (Array.isArray(p.features) ? (p.features as string[]) : []).join("\n"),
          faq,
          status: p.status,
          courseIds: p.courses.map((c) => c.courseId),
          examIds: p.exams.map((e) => e.examId),
          videoIds,
        }}
      />
    </>
  );
}

export default function EditProductPage({ params }: PageProps<"/admin/produk/[id]">) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}
