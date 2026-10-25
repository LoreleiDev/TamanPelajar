import Image from "next/image";
import Link from "next/link";

/** Banner promosi dari admin (C.2.8). Tidak tampil sama sekali bila tidak ada banner aktif. */
export function BannerStrip({ banners }: { banners: { id: string; title: string; href: string | null; imageUrl: string }[] }) {
  if (banners.length === 0) return null;
  return (
    <section aria-label="Pengumuman" className="page-container py-6">
      <ul className={`grid gap-4 ${banners.length > 1 ? "md:grid-cols-2" : ""} ${banners.length > 2 ? "xl:grid-cols-3" : ""}`}>
        {banners.map((b) => {
          const img = <Image src={b.imageUrl} alt={b.title} width={1200} height={400} sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw" className="aspect-[3/1] w-full rounded-xl object-cover" />;
          return (
            <li key={b.id}>
              {b.href ? (
                <Link href={b.href} className="block rounded-xl transition-opacity duration-150 hover:opacity-90 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
                  {img}
                </Link>
              ) : (
                img
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
