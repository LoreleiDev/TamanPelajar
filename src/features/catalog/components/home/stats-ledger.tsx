import type { PlatformStats } from "@/features/catalog/types";

const number = new Intl.NumberFormat("id-ID");

/**
 * Statistik platform (D.1.6) bergaya buku besar. Angka diambil dari database (saat
 * ini data contoh seed), apa adanya meskipun kecil.
 */
export function StatsLedger({ stats }: { stats: PlatformStats }) {
  const rows = [
    { value: stats.students, caption: "siswa sudah membuat akun" },
    { value: stats.courses, caption: "kelas online, masing-masing empat bab" },
    { value: stats.questions, caption: "soal di bank soal, lengkap dengan pembahasan" },
    { value: stats.finishedTryouts, caption: "tryout selesai dikerjakan" },
  ];

  return (
    <section aria-labelledby="statistik-judul" className="page-container grid items-center gap-12 py-20 md:py-28 lg:grid-cols-12">
      <div className="flex flex-col gap-4 lg:col-span-5">
        <h2 id="statistik-judul" className="text-title">
          <span className="block text-muted-foreground">Taman ini</span>
          <span className="block">baru mulai tumbuh</span>
        </h2>
        <p className="text-lead max-w-[38ch]">
          Angka-angka ini dihitung langsung dari data platform. Kami menampilkannya apa adanya.
        </p>
      </div>
      {/* Grid 2×2: angka rata kiri di atas keterangannya, dipisah garis tipis seperti buku besar. */}
      <dl className="grid grid-cols-2 gap-x-6 gap-y-10 lg:col-span-6 lg:col-start-7">
        {rows.map((r) => (
          // dt sebelum dd (urutan HTML yang benar); flex-col-reverse menaruh angka di atas.
          <div key={r.caption} className="flex flex-col-reverse justify-end gap-3 border-t border-border pt-5" /* taste-skill-ignore: garis buku besar, border tipis brand */>
            <dt className="max-w-[22ch] text-base text-muted-foreground md:text-lg">{r.caption}</dt>
            <dd className="text-[clamp(3rem,1.75rem+4vw,5.5rem)] leading-none font-extrabold tracking-tight text-primary tabular-nums">
              {number.format(r.value)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
