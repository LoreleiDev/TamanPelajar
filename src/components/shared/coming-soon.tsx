import Link from "next/link";

import { SproutMark } from "@/components/shared/ornaments";
import { Button } from "@/components/ui/button";

/**
 * Halaman sementara untuk rute yang dibangun di tahap berikutnya, agar tidak ada
 * tautan mati (T.16). Menjelaskan apa yang akan ada dan memberi jalan ke halaman yang sudah jalan.
 */
export function ComingSoon({
  title,
  description,
  whatsComing,
}: {
  title: string;
  description: string;
  whatsComing: string[];
}) {
  return (
    <main className="page-container flex flex-1 flex-col justify-center gap-6 py-16 md:py-24">
      <SproutMark className="size-12" />
      <h1 className="text-title max-w-3xl text-primary">{title}</h1>
      <p className="text-lead max-w-2xl">{description}</p>
      <div className="flex max-w-2xl flex-col gap-2">
        <h2 className="font-bold">Yang akan tersedia di halaman ini</h2>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          {whatsComing.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link href="/program">Lihat katalog program</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/">Kembali ke beranda</Link>
        </Button>
      </div>
    </main>
  );
}
