import type { Metadata } from "next";
import type { WebSite } from "schema-dts";

import { JsonLd } from "@/components/shared/json-ld";
import { Advantages } from "@/features/catalog/components/home/advantages";
import { BannerStrip } from "@/features/catalog/components/home/banner-strip";
import { ClosingCta } from "@/features/catalog/components/home/closing-cta";
import { Hero } from "@/features/catalog/components/home/hero";
import { HomeFaq } from "@/features/catalog/components/home/home-faq";
import { LiveSearch } from "@/features/catalog/components/home/live-search";
import { ProgramLineup } from "@/features/catalog/components/home/program-lineup";
import { QuickMenu } from "@/features/catalog/components/home/quick-menu";
import { Recommended } from "@/features/catalog/components/home/recommended";
import { StatsLedger } from "@/features/catalog/components/home/stats-ledger";
import { TestimonialLetters } from "@/features/catalog/components/home/testimonial-letters";
import {
  getPlatformStats,
  listActiveBanners,
  listAllProductsForSearch,
  listCategories,
  listFeaturedProducts,
  listHomeFaq,
  listTestimonials,
} from "@/features/catalog/queries";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

// Beranda (D.1).
export default async function HomePage() {
  const [stats, categories, featured, allProducts, testimonials, faq, banners] = await Promise.all([
    getPlatformStats(),
    listCategories(),
    listFeaturedProducts(3),
    listAllProductsForSearch(),
    listTestimonials(),
    listHomeFaq(),
    listActiveBanners(),
  ]);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <main>
      <JsonLd<WebSite>
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Taman Pelajar",
          url: appUrl,
          inLanguage: "id-ID",
          potentialAction: {
            "@type": "SearchAction",
            target: `${appUrl}/program?q={search_term_string}`,
            // schema-dts belum mengetik properti "query-input" milik Google
            ...({ "query-input": "required name=search_term_string" } as object),
          },
        }}
      />
      <Hero stats={stats} />
      <QuickMenu />
      <BannerStrip banners={banners} />
      <ProgramLineup categories={categories} />
      <LiveSearch products={allProducts} />
      <Recommended products={featured} />
      <Advantages />
      <StatsLedger stats={stats} />
      <TestimonialLetters items={testimonials} />
      <HomeFaq items={faq} />
      <ClosingCta />
    </main>
  );
}
