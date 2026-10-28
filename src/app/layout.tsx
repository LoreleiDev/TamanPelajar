import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Suspense } from "react";

import { NavigationProgress } from "@/components/layout/navigation-progress";
import { LoginRequiredProvider } from "@/components/shared/require-login";
import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Taman Pelajar — Bimbel online, video, dan tryout CBT",
    template: "%s | Taman Pelajar",
  },
  description:
    "Belajar untuk UTBK/SNBT, SKD CPNS, sekolah kedinasan, dan tes potensi akademik lewat kelas online, video pembelajaran, dan tryout CBT dengan pembahasan.",
  applicationName: "Taman Pelajar",
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "Taman Pelajar",
    images: [{ url: "/logo-taman-pelajar.jpeg", width: 746, height: 746, alt: "Taman Pelajar" }],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${jakarta.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {/* useSearchParams butuh Suspense (cacheComponents). */}
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        <LoginRequiredProvider>{children}</LoginRequiredProvider>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
