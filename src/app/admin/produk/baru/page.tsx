import type { Metadata } from "next";
import { Suspense } from "react";

import { ProductForm } from "@/components/admin/product-form";
import { DashboardHeading, DashboardSkeleton } from "@/components/shared/dashboard-parts";
import { Breadcrumb } from "@/components/shared/page-header";
import { getExamCategories } from "@/features/admin/exams/queries";
import { adminPage } from "@/features/admin/guard";
import { getProductContentOptions } from "@/features/admin/products/queries";

export const metadata: Metadata = { title: "Buat paket", robots: { index: false } };

async function Content() {
  await adminPage("/admin/produk/baru");
  const [categories, options] = await Promise.all([getExamCategories(), getProductContentOptions()]);
  return (
    <ProductForm
      categories={categories}
      options={options}
      thumbnail={null}
      defaults={{
        name: "",
        slug: "",
        categoryId: categories[0]?.id ?? "",
        programType: "BUNDEL",
        educationLevel: "UMUM",
        summary: "",
        description: "",
        thumbnailId: null,
        price: "",
        promoPrice: "",
        activeDays: "180",
        features: "",
        faq: [],
        status: "DRAF",
        courseIds: [],
        examIds: [],
        videoIds: [],
      }}
    />
  );
}

export default function NewProductPage() {
  return (
    <>
      <Breadcrumb items={[{ label: "Paket produk", href: "/admin/produk" }, { label: "Buat paket" }]} />
      <DashboardHeading title="Buat paket" />
      <Suspense fallback={<DashboardSkeleton />}>
        <Content />
      </Suspense>
    </>
  );
}
