import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  // Sementara: halaman transaksi lengkap (K.3, bayar, invoice) dibangun di Tahap 4.
  // Bottom nav dan menu akun menautkan ke /transaksi, jadi dialihkan ke riwayat di dashboard.
  async redirects() {
    return [{ source: "/transaksi", destination: "/dashboard/transaksi", permanent: false }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
