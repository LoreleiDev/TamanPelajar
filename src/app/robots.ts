import type { MetadataRoute } from "next";

const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

// robots.txt (Q.2.4): halaman akun, ujian, transaksi, panel admin, dan API tidak diindeks.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/dashboard", "/ujian", "/keranjang", "/checkout", "/transaksi", "/invoice", "/lengkapi-profil", "/api/", "/style-guide"],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
