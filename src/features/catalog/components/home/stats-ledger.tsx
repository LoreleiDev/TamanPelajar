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
    <section aria-labelledby="statistik-judul" className="page-container grid gap-12 py-20 md:py-28 lg:grid-cols-12">
      <div className="flex flex-col justify-center gap-4 lg:col-span-6 xl:col-span-5">
        <h2 id="statistik-judul" className="text-title">
          <span className="block text-muted-foreground">Taman ini</span>
          <span className="block">baru mulai tumbuh</span>
        </h2>
        <p className="text-lead max-w-[38ch]">
          Angka di samping dihitung langsung dari data platform. Kami menampilkannya apa adanya.
        </p>
      </div>
      <dl className="flex flex-col gap-5 lg:col-span-6 lg:col-start-7 xl:col-span-6 xl:col-start-7">
        {rows.map((r) => (
          <div key={r.caption} className="grid grid-cols-[minmax(0,5.5rem)_1fr] items-baseline gap-x-5 md:grid-cols-[8rem_1fr]">
            <dd className="text-right text-[clamp(3.5rem,2rem+5vw,6.5rem)] leading-none font-extrabold tracking-tight text-primary tabular-nums">
              {number.format(r.value)}
            </dd>
            <dt className="text-base md:text-lg">{r.caption}</dt>
          </div>
        ))}
      </dl>
    </section>
  );
}
