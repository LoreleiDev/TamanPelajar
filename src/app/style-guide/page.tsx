import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { Logo } from "@/components/layout/logo";
import { CheckList } from "@/components/shared/check-list";
import { EmptyState } from "@/components/shared/empty-state";
import { GrowthProgress } from "@/components/shared/growth-progress";
import { DotPattern, OrganicCorners, SproutDivider } from "@/components/shared/ornaments";
import { PriceTag } from "@/components/shared/price-tag";
import { ProductCard, ProductCardSkeleton } from "@/components/shared/product-card";
import { Rating, Stars } from "@/components/shared/rating";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { listFeaturedProducts } from "@/features/catalog/queries";
import { formatRupiah } from "@/lib/format";

import { DemoControls } from "./demo-controls";

export const metadata: Metadata = {
  title: "Panduan gaya",
  robots: { index: false, follow: false },
};

// Acuan komponen (B.1). Hanya untuk development; produksi mengembalikan 404.

const colors = [
  { token: "primary", hex: "#3F7042", use: "Tombol utama, tautan, heading brand", className: "bg-primary", ink: "text-white" },
  { token: "olive", hex: "#718A35", use: "Aksen sekunder, ujung gradient hero", className: "bg-olive", ink: "text-white" },
  { token: "leaf", hex: "#A0C064", use: "Badge, progres (bukan untuk teks)", className: "bg-leaf", ink: "text-foreground" },
  { token: "bark", hex: "#6E531C", use: "Aksen kecil, secukupnya", className: "bg-bark", ink: "text-white" },
  { token: "muted / border", hex: "#D6D7D6", use: "Latar sekunder, garis", className: "bg-muted", ink: "text-foreground" },
  { token: "foreground", hex: "#283331", use: "Teks utama", className: "bg-foreground", ink: "text-white" },
  { token: "success", hex: "#15803D", use: "Status benar, selalu dengan ikon", className: "bg-success", ink: "text-white" },
  { token: "destructive", hex: "#B42318", use: "Status salah dan aksi berbahaya", className: "bg-destructive", ink: "text-white" },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-6 pt-6">
      <h2 className="text-heading text-foreground">{title}</h2>
      {children}
    </section>
  );
}

export default async function StyleGuidePage() {
  if (process.env.NODE_ENV === "production") notFound();
  const [sample] = await listFeaturedProducts(1);

  return (
    <main className="page-container flex flex-col gap-14 py-12">
      <header className="flex flex-col gap-4">
        <Logo />
        <h1 className="text-title text-primary uppercase">Panduan gaya</h1>
        <p className="text-lead max-w-2xl">
          Komponen yang dipakai semua halaman Taman Pelajar. Buat varian baru di sini lebih dulu, bukan di
          halaman masing-masing.
        </p>
      </header>

      <Section title="Warna">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {colors.map((c) => (
            <li key={c.token} className="overflow-hidden rounded-xl border border-border">
              <div className={`${c.className} ${c.ink} flex h-24 items-end p-3 font-semibold`}>{c.hex}</div>
              <div className="p-3 text-sm">
                <p className="font-bold">{c.token}</p>
                <p className="text-muted-foreground">{c.use}</p>
              </div>
            </li>
          ))}
        </ul>
        <div
          // Gradient hero diwajibkan CLAUDE.md (B.1, D.1.1)
          className="relative overflow-hidden rounded-xl bg-linear-to-br from-primary to-olive p-6 text-white" // taste-skill-ignore
        >
          <p className="font-semibold">Gradient hero: #3F7042 ke #718A35. Hanya untuk hero dan CTA.</p>
        </div>
      </Section>

      <Section title="Tipografi">
        <div className="flex flex-col gap-5">
          <p className="text-display text-primary uppercase">Tryout SKD</p>
          <p className="text-title">Judul halaman, text-title</p>
          <p className="text-heading">Judul section, text-heading</p>
          <p className="text-lg font-bold">Judul kartu, text-lg bold</p>
          <p className="text-lead max-w-prose">
            Paragraf pembuka, text-lead. Satu kalimat yang menjelaskan isi halaman dengan jelas.
          </p>
          <p className="max-w-prose">
            Teks isi 16 px dengan tinggi baris 1,5. Panjang baris dibatasi sekitar 65 karakter agar nyaman dibaca.
          </p>
          <p className="text-sm text-muted-foreground">Catatan kecil, text-sm muted.</p>
          <p className="text-heading tabular-nums">
            {formatRupiah(349000)} <span className="text-muted-foreground">nilai 412,5</span>
          </p>
        </div>
      </Section>

      <Section title="Tombol">
        <div className="flex flex-wrap items-center gap-3">
          <Button size="lg">Mulai belajar</Button>
          <Button>Simpan jawaban</Button>
          <Button variant="outline">Lihat detail</Button>
          <Button variant="secondary">Ragu-ragu</Button>
          <Button variant="ghost">Batal</Button>
          <Button variant="link">Lihat semua paket</Button>
          <Button variant="destructive">Hapus</Button>
          <Button disabled>Memproses…</Button>
        </div>
        <div className="flex flex-wrap gap-3 rounded-xl bg-primary p-6">
          <Button size="lg" variant="inverse">
            Mulai belajar
          </Button>
          <Button size="lg" variant="inverse-outline">
            Lihat tryout
          </Button>
        </div>
      </Section>

      <Section title="Form">
        <div className="grid max-w-2xl gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="sg-nama">Nama lengkap</Label>
            <Input id="sg-nama" placeholder="Contoh: Rani Oktaviani" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="sg-email">Email</Label>
            <Input id="sg-email" type="email" aria-invalid="true" defaultValue="rani@" />
            <p className="text-sm text-destructive">Format email belum lengkap, contoh: nama@domain.com</p>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="sg-jenjang">Jenjang pendidikan</Label>
            <Select>
              <SelectTrigger id="sg-jenjang" className="w-full">
                <SelectValue placeholder="Pilih jenjang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SMA">SMA/MA</SelectItem>
                <SelectItem value="S1">S1</SelectItem>
                <SelectItem value="UMUM">Umum</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 self-end pb-2">
            <Checkbox id="sg-setuju" />
            <Label htmlFor="sg-setuju" className="font-normal">
              Saya menyetujui syarat dan ketentuan
            </Label>
          </div>
        </div>
      </Section>

      <Section title="Kartu paket, harga, rating">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sample && <ProductCard product={sample} />}
          <ProductCardSkeleton />
          <div className="flex flex-col gap-4">
            <PriceTag price={499000} promoPrice={349000} size="lg" />
            <PriceTag price={179000} promoPrice={null} />
            <Rating value={4.6} count={23} />
            <Rating value={null} count={0} />
            <Stars value={4} />
          </div>
        </div>
      </Section>

      <Section title="Badge dan status">
        <div className="flex flex-wrap gap-2">
          <Badge>Paket lengkap</Badge>
          <Badge variant="secondary">Kelas</Badge>
          <Badge variant="outline">Tryout</Badge>
          <Badge className="bg-leaf text-foreground">Gratis</Badge>
          <Badge className="bg-success text-white">Benar</Badge>
          <Badge variant="destructive">Salah</Badge>
        </div>
      </Section>

      <Section title="Daftar keunggulan dan progres">
        <div className="grid gap-8 md:grid-cols-2">
          <CheckList items={["Pelatihan berkualitas", "Penilaian cermat", "Sertifikat akurat"]} />
          <div className="flex flex-col gap-6">
            <GrowthProgress value={42} label="Penalaran Umum" />
            <GrowthProgress value={100} label="Literasi Bahasa Indonesia" />
          </div>
        </div>
      </Section>

      <Section title="Tabel">
        <div className="overflow-x-auto rounded-xl border border-border outline-none focus-visible:ring-3 focus-visible:ring-ring/50" tabIndex={0} role="region" aria-label="Tabel, geser ke samping bila perlu">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <caption className="sr-only">Contoh tabel nilai tryout</caption>
            <thead className="bg-secondary text-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Subtes</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Benar</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Nilai</th>
                <th scope="col" className="px-4 py-3 font-semibold">Ambang batas</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {[
                ["TWK", 21, 105, "Lulus"],
                ["TIU", 18, 90, "Belum lulus"],
                ["TKP", 45, 178, "Lulus"],
              ].map(([name, correct, score, status]) => (
                <tr key={name} className="border-t border-border" /* taste-skill-ignore: baris tabel */>
                  <th scope="row" className="px-4 py-3 font-semibold">{name}</th>
                  <td className="px-4 py-3 text-right">{correct}</td>
                  <td className="px-4 py-3 text-right">{score}</td>
                  <td className="px-4 py-3">{status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Keadaan kosong dan skeleton">
        <div className="grid gap-6 md:grid-cols-2">
          <EmptyState
            title="Belum ada tryout yang dikerjakan"
            description="Mulai dari Tryout UTBK Paket 1 untuk melihat posisi nilai Anda."
            action={<Button>Lihat daftar tryout</Button>}
          />
          <div className="flex flex-col gap-3" aria-hidden="true">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </Section>

      <Section title="Ornamen">
        <SproutDivider />
        <div className="relative h-56 overflow-hidden rounded-xl border border-border">
          <OrganicCorners />
          <DotPattern className="absolute top-6 left-6 text-leaf" />
        </div>
      </Section>

      <Section title="Dialog dan toast">
        <DemoControls />
      </Section>
    </main>
  );
}
