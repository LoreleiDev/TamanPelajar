import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Fitur unggulan (D.1.5) sebagai panel terbelah: pernyataan di sel terang, lima baris
// hijau gelap yang dibedakan nada warna, bukan garis.
const rows = [
  {
    title: "Materi terstruktur",
    body: "Setiap kelas dibagi per bab dari pengenalan sampai latihan, jadi kamu tahu harus mulai dari mana.",
    terms: ["Video per topik", "PDF ringkasan", "Kuis tiap bab"],
  },
  {
    title: "Tryout real-time",
    body: "Timer dihitung server, jawaban tersimpan otomatis, dan ujian terkumpul sendiri saat waktu habis.",
    terms: ["Timer per subtes", "Simpan otomatis", "Ragu-ragu"],
  },
  {
    title: "Pembahasan lengkap",
    body: "Setiap soal punya penjelasan langkah demi langkah, sebagian dengan video pembahasan.",
    terms: ["Jawabanmu", "Kunci", "Langkah penyelesaian"],
  },
  {
    title: "Analisis kemampuan",
    body: "Nilai dipecah per topik dan tingkat kesulitan, lalu dibandingkan dengan rata-rata peserta.",
    terms: ["Nilai per topik", "Peringkat", "Rekomendasi materi"],
  },
  {
    title: "Akses fleksibel",
    body: "Belajar dari ponsel atau laptop. Video dilanjutkan dari posisi terakhir yang kamu tonton.",
    terms: ["Ponsel", "Laptop", "Lanjut dari terakhir"],
  },
];

export function Advantages() {
  return (
    <section aria-labelledby="keunggulan-judul" className="grid lg:grid-cols-2">
      <div className="flex flex-col justify-between gap-10 bg-accent px-4 py-16 md:px-8 lg:min-h-[44rem] lg:px-[max(2rem,calc((100vw-80rem)/2+2rem))] lg:py-24">
        <h2 id="keunggulan-judul" className="text-title text-primary">
          <span className="block">Belajar runtut,</span>
          <span className="block lg:text-right">uji seperti aslinya</span>
        </h2>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <p className="text-lead max-w-[34ch]">
            Lima hal yang membedakan cara belajar di Taman Pelajar dari sekadar kumpulan soal.
          </p>
          <Button asChild size="lg" className="self-start sm:self-auto">
            <Link href="/program">Mulai belajar</Link>
          </Button>
        </div>
      </div>
      <ul className="flex flex-col text-white">
        {rows.map((r, i) => (
          <li
            key={r.title}
            className={cn(
              "grid flex-1 gap-3 px-4 py-7 md:grid-cols-[5fr_4fr_3fr] md:gap-6 md:px-8",
              i % 2 === 0 ? "bg-primary" : "bg-primary-hover",
            )}
          >
            <h3 className="text-[1.5rem] leading-tight font-bold lg:text-[1.75rem]">{r.title}</h3>
            <p className="text-white/90">{r.body}</p>
            <p className="text-sm text-white/80 md:text-[0.9375rem]">
              <span className="sr-only">Termasuk: </span>
              <span className="md:hidden">{r.terms.join(", ")}</span>
              <span className="hidden md:flex md:flex-col md:gap-1">
                {r.terms.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </span>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
