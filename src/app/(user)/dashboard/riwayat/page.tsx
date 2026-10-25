import { CircleCheck, CircleX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { DashboardHeading, DashboardSkeleton } from "@/components/shared/dashboard-parts";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { getResults } from "@/features/dashboard/queries";
import { formatClock, formatTanggalJam } from "@/lib/format";
import { requireUserPage } from "@/lib/rbac";

export const metadata: Metadata = { title: "Riwayat hasil", robots: { index: false } };
const num = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });

function PassBadge({ passed }: { passed: boolean | null }) {
  if (passed === null) return <span className="text-muted-foreground">Tanpa ambang batas</span>;
  return passed ? (
    <span className="inline-flex items-center gap-1 font-semibold text-success">
      <CircleCheck className="size-4" aria-hidden="true" /> Lulus
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 font-semibold text-destructive">
      <CircleX className="size-4" aria-hidden="true" /> Belum lulus
    </span>
  );
}

async function Content() {
  const user = await requireUserPage("/dashboard/riwayat");
  const results = await getResults(user.id);
  return (
    <>
      <DashboardHeading title="Riwayat hasil">Semua percobaan tryout yang sudah dikumpulkan, terbaru di atas.</DashboardHeading>
      {results.length === 0 ? (
        <EmptyState
          title="Belum ada hasil tryout"
          description="Hasil muncul di sini setelah kamu mengumpulkan tryout pertama."
          action={
            <Button asChild>
              <Link href="/dashboard/tryout">Lihat tryout saya</Link>
            </Button>
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {results.map((r) => (
            <li key={r.attemptId}>
              <details className="group rounded-xl border border-border">
                <summary className="grid cursor-pointer list-none gap-x-6 gap-y-1 px-4 py-3 hover:bg-secondary sm:grid-cols-[1fr_auto_auto] sm:items-center [&::-webkit-details-marker]:hidden">
                  <span>
                    <span className="font-bold">{r.examTitle}</span>{" "}
                    <span className="text-muted-foreground tabular-nums">percobaan ke-{r.attemptNo}</span>
                    <span className="block text-sm text-muted-foreground">{formatTanggalJam(r.submittedAt)}</span>
                  </span>
                  <span className="text-lg font-extrabold tabular-nums">
                    {num.format(r.score)}
                    <span className="text-sm font-normal text-muted-foreground">/{num.format(r.maxScore)}</span>
                  </span>
                  <PassBadge passed={r.passed} />
                </summary>
                <div className="flex flex-col gap-3 px-4 pb-4">
                  <p className="text-sm tabular-nums">
                    Benar <strong>{r.correct}</strong>, salah <strong>{r.wrong}</strong>, kosong <strong>{r.empty}</strong>, waktu
                    pengerjaan <strong>{formatClock(r.durationSec)}</strong>.
                  </p>
                  <table className="w-full text-left text-sm tabular-nums">
                    <caption className="sr-only">Nilai per subtes {r.examTitle}</caption>
                    <thead>
                      <tr className="text-muted-foreground">
                        <th scope="col" className="py-1 font-semibold">Subtes</th>
                        <th scope="col" className="py-1 text-right font-semibold">Nilai</th>
                        <th scope="col" className="py-1 pl-4 font-semibold">Ambang batas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {r.sections.map((s) => (
                        <tr key={s.title}>
                          <th scope="row" className="py-1 font-normal">{s.title}</th>
                          <td className="py-1 text-right">
                            {num.format(s.score)}/{num.format(s.maxScore)}
                          </td>
                          <td className="py-1 pl-4">
                            <PassBadge passed={s.passed} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Link href={`/tryout/hasil/${r.attemptId}`} className="self-start font-semibold text-primary hover:underline">
                    Lihat hasil lengkap dan pembahasan
                    <span className="sr-only"> {r.examTitle} percobaan ke-{r.attemptNo}</span>
                  </Link>
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

// Riwayat Hasil (F.1, I.6.1–I.6.3). Hasil lengkap dan pembahasan di /tryout/hasil/[attemptId].
export default function Page() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Content />
    </Suspense>
  );
}
