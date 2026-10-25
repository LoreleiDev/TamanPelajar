import { CircleCheck, Clock, History, Lock, PlayCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { StartExamForm } from "@/components/exam/start-exam-form";
import { PriceTag } from "@/components/shared/price-tag";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { startBlockMessage } from "@/features/exam/engine";
import { getExamDetail, getUserExamStates, listExamSlugs, type ExamDetail } from "@/features/exam/queries";
import { formatTanggalJam } from "@/lib/format";
import { currentUser } from "@/lib/rbac";

export async function generateStaticParams() {
  return (await listExamSlugs()).map((slug) => ({ slug }));
}

// Slug lain dirender blocking agar tryout yang tidak ada mengembalikan 404.
export const instant = false;

export async function generateMetadata({ params }: PageProps<"/tryout/[slug]">): Promise<Metadata> {
  const e = await getExamDetail((await params).slug);
  if (!e) return { title: "Tryout tidak ditemukan" };
  return { title: `${e.title}: petunjuk`, description: e.description, alternates: { canonical: `/tryout/${e.slug}` } };
}

const num = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 });
const signed = (n: number) => (n > 0 ? `+${num.format(n)}` : num.format(n));

/** Panel mulai, bergantung pada sesi pengguna (I.2). */
async function StartPanel({ exam }: { exam: ExamDetail }) {
  const user = await currentUser();
  if (!user) return <StartExamForm slug={exam.slug} title={exam.title} guest />;
  const st = (await getUserExamStates(user, [exam.slug])).get(exam.slug);
  if (!st) return null;

  const summary = (
    <p className="text-sm text-muted-foreground tabular-nums">
      Percobaan terpakai {st.attemptsUsed} dari {exam.maxAttempts}
      {st.bestPercent !== null && `, nilai tertinggi ${num.format(st.bestPercent)}%`}.
    </p>
  );

  if (st.ongoingAttemptId) {
    return (
      <div className="flex flex-col gap-3">
        <p>Kamu masih punya percobaan yang sedang berjalan. Waktunya tetap berjalan meski halaman ditutup.</p>
        <Button asChild size="lg" className="self-start">
          <Link href={`/ujian/${st.ongoingAttemptId}`}>
            <PlayCircle aria-hidden="true" data-icon="inline-start" />
            Lanjutkan tryout
          </Link>
        </Button>
        {summary}
      </div>
    );
  }

  if (st.block === "PERLU_PAKET") {
    return (
      <div className="flex flex-col gap-3">
        <p className="flex items-center gap-2 font-semibold">
          <Lock aria-hidden="true" className="size-4.5 text-primary" />
          {startBlockMessage.PERLU_PAKET}
        </p>
        {exam.products.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {exam.products.map((p) => (
              <li key={p.slug} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-secondary px-4 py-3">
                <Link href={`/paket/${p.slug}`} className="font-semibold hover:text-primary">
                  {p.name}
                </Link>
                <PriceTag price={p.price} promoPrice={p.promoPrice} size="sm" />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">Paket untuk tryout ini sedang disiapkan.</p>
        )}
      </div>
    );
  }

  if (st.block) {
    return (
      <div className="flex flex-col gap-3">
        <p className="font-semibold">{startBlockMessage[st.block]}</p>
        {summary}
        {st.lastFinishedAttemptId && (
          <Button asChild variant="outline" className="self-start">
            <Link href={`/tryout/hasil/${st.lastFinishedAttemptId}`}>
              <History aria-hidden="true" data-icon="inline-start" />
              Lihat hasil terakhir
            </Link>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <StartExamForm slug={exam.slug} title={exam.title} guest={false} />
      {summary}
    </div>
  );
}

// Halaman petunjuk tryout (I.2). Tamu bisa membaca petunjuk; mulai butuh masuk dan paket.
export default async function TryoutDetailPage({ params }: PageProps<"/tryout/[slug]">) {
  const exam = await getExamDetail((await params).slug);
  if (!exam) notFound();
  const sequential = exam.sections.every((s) => s.durationMin);
  const rules = [
    sequential
      ? "Subtes dikerjakan berurutan. Setiap subtes punya waktu sendiri; subtes yang sudah ditutup tidak bisa dibuka lagi."
      : "Semua subtes bisa dikerjakan dalam satu waktu; kamu bebas berpindah soal.",
    "Waktu dihitung server sejak tombol Mulai Tryout ditekan dan tetap berjalan bila halaman ditutup.",
    "Jawaban tersimpan otomatis setiap kali kamu memilih atau mengetik. Muat ulang halaman tidak menghapus jawaban.",
    "Tandai ragu-ragu untuk soal yang ingin kamu periksa lagi sebelum mengumpulkan.",
    "Peringatan muncul saat sisa waktu 10, 5, dan 1 menit. Saat waktu habis, jawaban dikumpulkan otomatis.",
    "Perpindahan tab dan keluar dari layar penuh dicatat sebagai aktivitas ujian.",
    exam.shuffleQuestions || exam.shuffleOptions ? "Urutan soal atau pilihan jawaban diacak untuk setiap peserta." : null,
  ].filter((r): r is string => Boolean(r));

  return (
    <main className="flex flex-col">
      <PageHeader
        breadcrumb={[{ label: "Tryout", href: "/tryout" }, { label: exam.category.name }]}
        eyebrow="Petunjuk tryout"
        title={exam.title}
        description={exam.description}
      />

      <div className="page-container grid gap-10 py-10 md:py-12 lg:grid-cols-[minmax(0,1fr)_22rem] xl:gap-14">
        <article className="flex min-w-0 flex-col gap-8">

          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
            {[
              ["Durasi", `${exam.durationMin} menit`],
              ["Jumlah soal", `${exam.questionCount} soal`],
              ["Subtes", `${exam.sections.length} subtes`],
              ["Batas percobaan", `${exam.maxAttempts} kali`],
            ].map(([k, v]) => (
              <div key={k} className="flex flex-col gap-0.5">
                <dt className="text-sm text-muted-foreground">{k}</dt>
                <dd className="text-xl font-bold tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>

          <section aria-labelledby="subtes-judul" className="flex flex-col gap-3">
            <h2 id="subtes-judul" className="text-heading">
              Subtes
            </h2>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-md text-left">
                <caption className="sr-only">Daftar subtes {exam.title}</caption>
                <thead className="bg-secondary text-sm">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">Subtes</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Soal</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Waktu</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Ambang batas</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {exam.sections.map((s, i) => (
                    <tr key={s.id} className="border-t border-border" /* taste-skill-ignore: baris tabel */>
                      <th scope="row" className="px-4 py-3 font-semibold">
                        {i + 1}. {s.title}
                      </th>
                      <td className="px-4 py-3 text-right">{s.questionCount}</td>
                      <td className="px-4 py-3 text-right">{s.durationMin ? `${s.durationMin} menit` : "Waktu bersama"}</td>
                      <td className="px-4 py-3 text-right">{s.passingGrade !== null ? num.format(s.passingGrade) : "–"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section aria-labelledby="nilai-judul" className="flex flex-col gap-3">
            <h2 id="nilai-judul" className="text-heading">
              Sistem penilaian
            </h2>
            <ul className="flex flex-col gap-1.5 tabular-nums">
              <li>
                Jawaban benar <span className="font-semibold">{signed(exam.correctScore)}</span> per soal
              </li>
              <li>
                Jawaban salah <span className="font-semibold">{signed(exam.wrongScore)}</span> per soal
              </li>
              <li>
                Tidak dijawab <span className="font-semibold">0</span>
              </li>
              <li>
                Nilai lulus minimal <span className="font-semibold">{num.format(exam.passingGrade)}</span>
                {exam.sections.some((s) => s.passingGrade !== null) && ", dan setiap subtes harus mencapai ambang batasnya"}
              </li>
            </ul>
          </section>

          <section aria-labelledby="aturan-judul" className="flex flex-col gap-3">
            <h2 id="aturan-judul" className="text-heading">
              Aturan ujian
            </h2>
            {exam.rules && <p className="max-w-[70ch] leading-relaxed">{exam.rules}</p>}
            <ul className="flex flex-col gap-2">
              {rules.map((r) => (
                <li key={r} className="flex gap-2.5 leading-relaxed">
                  <CircleCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
                  {r}
                </li>
              ))}
            </ul>
          </section>
        </article>

        <aside aria-labelledby="mulai-judul" className="flex flex-col gap-4 self-start rounded-xl bg-secondary p-5 lg:sticky lg:top-24">
          <h2 id="mulai-judul" className="text-lg font-bold">
            Siap mengerjakan?
          </h2>
          <p className="flex items-center gap-2 text-sm tabular-nums">
            <Clock aria-hidden="true" className="size-4 text-primary" />
            {exam.opensAt || exam.closesAt
              ? [exam.opensAt && `Dibuka ${formatTanggalJam(exam.opensAt)}`, exam.closesAt && `ditutup ${formatTanggalJam(exam.closesAt)}`]
                  .filter(Boolean)
                  .join(", ")
              : "Bisa dikerjakan kapan saja"}
          </p>
          <Suspense
            fallback={
              <div className="flex flex-col gap-3" aria-busy="true" aria-label="Memuat status tryout">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-11 w-40" />
              </div>
            }
          >
            <StartPanel exam={exam} />
          </Suspense>
        </aside>
      </div>
    </main>
  );
}
