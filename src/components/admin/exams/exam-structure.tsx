"use client";

import { ArrowDown, ArrowUp, Lock, Pencil, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { SortableList } from "@/components/admin/sortable-list";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { hapusSubtes, keluarkanSoalTryout, pindahSubtes, ubahBobotSoalTryout, urutkanSoalTryout } from "@/features/admin/exams/actions";
import { difficultyLabel, questionTypeLabel, type QuestionTypeCode } from "@/features/admin/questions/schemas";

import { QuestionPicker } from "./question-picker";
import { SectionDialog } from "./section-dialog";

export interface StructureQuestion {
  id: string;
  questionId: string;
  excerpt: string;
  type: QuestionTypeCode;
  topic: string;
  difficulty: "MUDAH" | "SEDANG" | "SULIT";
  weight: number | null;
  baseWeight: number;
  draft: boolean;
  deleted: boolean;
}

export interface StructureSection {
  id: string;
  title: string;
  durationMin: number | null;
  weight: number;
  passingGrade: number | null;
  questions: StructureQuestion[];
}

const num = (n: number) => String(n).replace(".", ",");

/** Subtes dan soal tryout (M.6.7, M.6.8): urutan seret-dan-lepas, bobot per soal. */
export function ExamStructure({
  examId,
  locked,
  attemptCount,
  sections,
  categories,
  categoryId,
  subjects,
}: {
  examId: string;
  locked: boolean;
  attemptCount: number;
  sections: StructureSection[];
  categories: { id: string; name: string }[];
  categoryId: string;
  subjects: string[];
}) {
  const router = useRouter();
  const run = async (p: Promise<{ ok: boolean; error?: string }>, success?: string) => {
    const r = await p;
    if (!r.ok) {
      toast.error(r.error);
      return false;
    }
    if (success) toast.success(success);
    router.refresh();
    return true;
  };
  const totalQuestions = sections.reduce((n, s) => n + s.questions.length, 0);
  const allTimed = sections.length > 0 && sections.every((s) => s.durationMin !== null);

  return (
    <div className="flex flex-col gap-6">
      {locked ? (
        <p role="status" className="flex items-start gap-2 rounded-xl border border-warning bg-warning/10 px-4 py-3 text-sm">
          <Lock aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning" />
          <span>
            Sudah ada {attemptCount} percobaan, jadi subtes dan soal tidak bisa ditambah, dihapus, atau diurutkan ulang. Nama dan passing grade subtes masih bisa diubah. Duplikat tryout untuk membuat versi baru.
          </span>
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          {totalQuestions} soal dalam {sections.length} subtes.{" "}
          {allTimed ? "Semua subtes berdurasi: dikerjakan berurutan dengan waktu masing-masing." : "Ada subtes tanpa durasi: siswa bebas berpindah subtes dalam durasi total."}
        </p>
      )}

      {sections.map((s, si) => (
        <section key={s.id} aria-labelledby={`subtes-${s.id}`} className="flex flex-col gap-3 rounded-xl border border-border p-4">
          <header className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 id={`subtes-${s.id}`} className="text-lg font-bold">
                {si + 1}. {s.title}
              </h3>
              <p className="text-sm text-muted-foreground tabular-nums">
                {s.questions.length} soal · {s.durationMin ? `${s.durationMin} menit` : "tanpa durasi sendiri"} · bobot {num(s.weight)}
                {s.passingGrade !== null && ` · passing grade ${num(s.passingGrade)}`}
              </p>
            </div>
            <div className="flex flex-wrap gap-1">
              <SectionDialog
                title="Ubah subtes"
                defaults={{ examId, id: s.id, title: s.title, durationMin: s.durationMin === null ? "" : String(s.durationMin), weight: num(s.weight), passingGrade: s.passingGrade === null ? "" : num(s.passingGrade) }}
                trigger={
                  <Button size="icon" variant="ghost" aria-label={`Ubah subtes ${s.title}`}>
                    <Pencil />
                  </Button>
                }
              />
              {!locked && (
                <>
                  <Button size="icon" variant="ghost" aria-label={`Naikkan subtes ${s.title}`} disabled={si === 0} onClick={() => run(pindahSubtes({ id: s.id, direction: "naik" }))}>
                    <ArrowUp />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Turunkan subtes ${s.title}`}
                    disabled={si === sections.length - 1}
                    onClick={() => run(pindahSubtes({ id: s.id, direction: "turun" }))}
                  >
                    <ArrowDown />
                  </Button>
                  <ConfirmDialog
                    trigger={
                      <Button size="icon" variant="ghost" aria-label={`Hapus subtes ${s.title}`} className="text-destructive hover:text-destructive">
                        <Trash2 />
                      </Button>
                    }
                    title={`Hapus subtes ${s.title}?`}
                    description="Subtes dan daftar soalnya dihapus dari tryout ini. Soal tetap ada di bank soal."
                    confirmLabel="Hapus subtes"
                    destructive
                    onConfirm={async () => void (await run(hapusSubtes({ id: s.id }), "Subtes dihapus."))}
                  />
                </>
              )}
            </div>
          </header>

          {s.questions.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">Belum ada soal di subtes ini.</p>
          ) : (
            <SortableList
              items={s.questions}
              label={`Soal subtes ${s.title}`}
              itemLabel={(q) => `soal ${s.questions.indexOf(q) + 1}`}
              disabled={locked}
              className="divide-y divide-border rounded-lg border border-border"
              onReorder={(ids) => run(urutkanSoalTryout({ sectionId: s.id, ids }))}
              renderItem={(q, handle) => (
                <div className="flex items-start gap-2 px-2 py-2.5 sm:gap-3 sm:px-3">
                  {handle}
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2">{q.excerpt}</p>
                    <p className="text-sm text-muted-foreground">
                      {questionTypeLabel[q.type]} · {q.topic} · {difficultyLabel[q.difficulty]}
                      {q.draft && <span className="font-semibold text-warning"> · masih draf</span>}
                      {q.deleted && <span className="font-semibold text-destructive"> · dihapus dari bank soal</span>}
                    </p>
                  </div>
                  <label className="flex shrink-0 flex-col items-end gap-0.5 text-xs text-muted-foreground">
                    Bobot
                    <input
                      defaultValue={q.weight === null ? "" : num(q.weight)}
                      placeholder={num(q.baseWeight)}
                      inputMode="decimal"
                      disabled={locked}
                      aria-label={`Bobot khusus soal, kosong berarti ${num(q.baseWeight)}`}
                      className="h-8 w-16 rounded-md border border-input bg-background px-2 text-right text-sm text-foreground tabular-nums disabled:opacity-60"
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        const current = q.weight === null ? "" : num(q.weight);
                        if (v !== current) void run(ubahBobotSoalTryout({ id: q.id, weight: v }), "Bobot soal disimpan.");
                      }}
                    />
                  </label>
                  {!locked && (
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Keluarkan soal dari subtes"
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => run(keluarkanSoalTryout({ id: q.id }), "Soal dikeluarkan dari subtes.")}
                    >
                      <X />
                    </Button>
                  )}
                </div>
              )}
            />
          )}
          {!locked && (
            <div>
              <QuestionPicker examId={examId} sectionId={s.id} sectionTitle={s.title} categories={categories} defaultCategoryId={categoryId} subjects={subjects} />
            </div>
          )}
        </section>
      ))}

      {!locked && (
        <SectionDialog
          title="Tambah subtes"
          defaults={{ examId, title: "", durationMin: "", weight: "1", passingGrade: "" }}
          trigger={
            <Button variant="outline" className="self-start">
              <Plus data-icon="inline-start" />
              Tambah subtes
            </Button>
          }
        />
      )}
    </div>
  );
}
