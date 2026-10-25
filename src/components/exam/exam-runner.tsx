"use client";

import { ChevronLeft, ChevronRight, CircleAlert, Clock, Flag, LayoutGrid, LogOut, Maximize, Minimize, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { catatAktivitas, kumpulkanTryout, lanjutSubtes, pindahSoal, simpanJawaban, type SectionState } from "@/features/exam/actions";
import { TIME_WARNINGS } from "@/features/exam/engine";
import type { ExamSession } from "@/features/exam/queries";
import { cn } from "@/lib/utils";

import { EMPTY_ANSWER, isAnswered, QuestionAnswer, type AnswerValue } from "./question-answer";
import { QuestionPalette, type PaletteSection, type QuestionStatus } from "./question-palette";
import { formatCountdown, useServerNow } from "./use-exam-clock";

type Session = Extract<ExamSession, { state: "berlangsung" }>;
type Answers = Record<string, AnswerValue & { isDoubtful: boolean }>;
type SaveState = { kind: "idle" } | { kind: "saving" } | { kind: "saved"; at: Date } | { kind: "error" };

const DEBOUNCE_MS = 1000;
const RETRY_MS = 3000;
const jam = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Asia/Jakarta" });

/** Halaman pengerjaan tryout CBT (I.3–I.4). Server tetap pemegang waktu dan kunci jawaban. */
export function ExamRunner({ session, resultHref }: { session: Session; resultHref: string }) {
  const router = useRouter();
  const nowSec = useServerNow(session.serverNow);

  const [sections, setSections] = useState(session.sections);
  const [activeSectionId, setActiveSectionId] = useState(session.activeSectionId);
  const [deadlineAt, setDeadlineAt] = useState(session.deadlineAt);
  const [answers, setAnswers] = useState<Answers>(() => {
    const out: Answers = {};
    for (const [id, a] of Object.entries(session.answers)) out[id] = { ...a };
    return out;
  });
  const [currentId, setCurrentId] = useState(() => {
    const inActive = (id: string | null) =>
      id && session.questions.some((q) => q.id === id && (session.mode === "bebas" || q.sectionId === session.activeSectionId));
    return inActive(session.currentQuestionId)
      ? session.currentQuestionId!
      : session.questions.find((q) => session.mode === "bebas" || q.sectionId === session.activeSectionId)!.id;
  });
  const [save, setSave] = useState<SaveState>({ kind: "idle" });
  const [tabLeaves, setTabLeaves] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [confirm, setConfirm] = useState<null | "kumpulkan" | "subtes" | "keluar">(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [announce, setAnnounce] = useState("");
  const [busy, startBusy] = useTransition();

  // Antrean autosave: jawaban terbaru per soal, dikirim setelah jeda 1 detik (I.4.2).
  const answersRef = useRef(answers);
  const pendingRef = useRef(new Set<string>());
  const timerRef = useRef<number | null>(null);
  const flushingRef = useRef<Promise<void> | null>(null);
  const finishingRef = useRef(false);
  // Waktu per soal (J.2.3): detik yang belum dikirim, plus awal kunjungan soal aktif.
  const spentRef = useRef(new Map<string, number>());
  const [mountedAt] = useState(() => Date.now());
  const visitRef = useRef({ id: currentId, since: mountedAt });
  // Untuk simpan ulang terjadwal dari dalam flush sendiri.
  const flushRef = useRef<() => Promise<void>>(async () => undefined);

  const visible = useMemo(
    () => session.questions.filter((q) => session.mode === "bebas" || q.sectionId === activeSectionId),
    [session.questions, session.mode, activeSectionId],
  );
  const index = Math.max(0, visible.findIndex((q) => q.id === currentId));
  const question = visible[index];
  const activeSection = sections.find((s) => s.id === activeSectionId)!;
  const isLastWindow = session.mode === "bebas" || sections.findIndex((s) => s.id === activeSectionId) === sections.length - 1;

  const status = (id: string): QuestionStatus => (answers[id]?.isDoubtful ? "ragu" : isAnswered(answers[id]) ? "dijawab" : "belum");
  const counts = {
    unanswered: visible.filter((q) => !isAnswered(answers[q.id])).length,
    doubtful: visible.filter((q) => answers[q.id]?.isDoubtful).length,
  };
  const remainingSec = nowSec === null ? null : Math.floor(new Date(deadlineAt).getTime() / 1000) - nowSec;

  /** Ambil detik di satu soal yang belum dikirim, lalu nolkan. */
  const takeSpent = useCallback((id: string) => {
    let sec = spentRef.current.get(id) ?? 0;
    if (visitRef.current.id === id) {
      sec += Math.round((Date.now() - visitRef.current.since) / 1000);
      visitRef.current = { id, since: Date.now() };
    }
    spentRef.current.set(id, 0);
    return Math.min(sec, 900);
  }, []);

  const goToResult = useCallback(() => {
    finishingRef.current = true;
    router.replace(resultHref);
    router.refresh();
  }, [router, resultHref]);

  const applyState = useCallback((state: SectionState) => {
    setSections((prev) => prev.map((s) => ({ ...s, ...state.sections.find((x) => x.id === s.id) })));
    if (state.activeSectionId) setActiveSectionId(state.activeSectionId);
    if (state.deadlineAt) setDeadlineAt(state.deadlineAt);
  }, []);

  const flush = useCallback(async (): Promise<void> => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    if (flushingRef.current) await flushingRef.current;
    if (pendingRef.current.size === 0) return;

    const run = (async () => {
      setSave({ kind: "saving" });
      for (const id of [...pendingRef.current]) {
        pendingRef.current.delete(id);
        const a = answersRef.current[id] ?? { ...EMPTY_ANSWER, isDoubtful: false };
        try {
          const r = await simpanJawaban({
            attemptId: session.attemptId,
            questionId: id,
            answer: { optionIds: a.optionIds, textAnswer: a.textAnswer, numberAnswer: a.numberAnswer },
            isDoubtful: a.isDoubtful,
            timeSpentDeltaSec: takeSpent(id),
          });
          if (!r.ok) {
            if (r.code === "WAKTU_HABIS") {
              toast.info(r.error);
              goToResult();
              return;
            }
            if (r.code === "SUBTES_DITUTUP") continue;
            toast.error(r.error);
            pendingRef.current.add(id);
            setSave({ kind: "error" });
            return;
          }
          applyState(r.data.state);
        } catch {
          // Jaringan putus: simpan ulang otomatis; jawaban tetap ada di layar.
          pendingRef.current.add(id);
          setSave({ kind: "error" });
          timerRef.current = window.setTimeout(() => void flushRef.current(), RETRY_MS);
          return;
        }
      }
      setSave({ kind: "saved", at: new Date() });
    })();
    flushingRef.current = run;
    await run;
    flushingRef.current = null;
  }, [session.attemptId, takeSpent, goToResult, applyState]);
  useEffect(() => {
    flushRef.current = flush;
  }, [flush]);

  const change = (id: string, patch: Partial<AnswerValue & { isDoubtful: boolean }>) => {
    const prev = answersRef.current[id] ?? { ...EMPTY_ANSWER, isDoubtful: false };
    const next = { ...answersRef.current, [id]: { ...prev, ...patch } };
    answersRef.current = next;
    setAnswers(next);
    pendingRef.current.add(id);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => void flush(), DEBOUNCE_MS);
  };

  const select = (id: string) => {
    if (id === currentId) return;
    const from = currentId;
    const delta = takeSpent(from);
    visitRef.current = { id, since: Date.now() };
    setCurrentId(id);
    setPaletteOpen(false);
    void flush();
    void pindahSoal({ attemptId: session.attemptId, questionId: id, fromQuestionId: from, timeSpentDeltaSec: delta }).then((r) => {
      if (!r.ok && r.code === "WAKTU_HABIS") goToResult();
    });
    document.getElementById("soal-judul")?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  };

  const submit = useCallback(
    (auto: boolean) =>
      startBusy(async () => {
        if (finishingRef.current && !auto) return;
        finishingRef.current = true;
        await flush();
        const r = await kumpulkanTryout({ attemptId: session.attemptId, auto });
        if (!r.ok) {
          finishingRef.current = false;
          return void toast.error(r.error);
        }
        toast.success(auto ? "Waktu habis. Jawabanmu sudah dikumpulkan." : "Tryout dikumpulkan.");
        goToResult();
      }),
    [flush, session.attemptId, goToResult],
  );

  const nextSection = useCallback(
    (auto: boolean) =>
      startBusy(async () => {
        await flush();
        const finishedTitle = sections.find((s) => s.id === activeSectionId)?.title;
        const r = await lanjutSubtes({ attemptId: session.attemptId });
        if (!r.ok) return void toast.error(r.error);
        if (r.data.finished || !r.data.state) {
          toast.success("Tryout dikumpulkan.");
          return goToResult();
        }
        const state = r.data.state;
        applyState(state);
        const first = session.questions.find((q) => q.sectionId === state.activeSectionId);
        if (first) {
          visitRef.current = { id: first.id, since: Date.now() };
          setCurrentId(first.id);
        }
        const nextTitle = sections.find((s) => s.id === state.activeSectionId)?.title;
        const msg = auto ? `Waktu ${finishedTitle} habis. Lanjut ke ${nextTitle}.` : `${finishedTitle} ditutup. Sekarang ${nextTitle}.`;
        toast.info(msg);
        setAnnounce(msg);
      }),
    [flush, sections, activeSectionId, session.attemptId, session.questions, goToResult, applyState],
  );

  // Peringatan sisa waktu 10, 5, 1 menit (I.4.5) dan pengumpulan otomatis (I.4.6).
  const warnedRef = useRef(new Set<string>());
  const windowKey = `${activeSectionId}-${deadlineAt}`;
  useEffect(() => {
    if (remainingSec === null) return;
    for (const m of TIME_WARNINGS) {
      const key = `${windowKey}-${m}`;
      if (warnedRef.current.has(key) || remainingSec > m * 60) continue;
      // Saat halaman baru dibuka dengan sisa di bawah ambang, tandai tanpa memberi peringatan lama.
      const fresh = remainingSec > m * 60 - 5;
      warnedRef.current.add(key);
      if (fresh && remainingSec > 0) {
        const where = session.mode === "berurutan" && !isLastWindow ? `subtes ${activeSection.title}` : "tryout";
        toast.warning(`Sisa waktu ${where} ${m} menit.`);
      }
    }
    if (remainingSec <= 0 && !finishingRef.current && !busy) {
      if (isLastWindow) submit(true);
      else nextSection(true);
    }
  }, [remainingSec, windowKey, isLastWindow, activeSection.title, session.mode, busy, submit, nextSection]);

  // Deteksi pindah tab dan fullscreen (I.4.10–I.4.12).
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden" && !finishingRef.current) {
        setTabLeaves((n) => n + 1);
        void catatAktivitas({ attemptId: session.attemptId, type: "PINDAH_TAB" });
        void flush();
      }
    };
    const onFullscreen = () => {
      const on = Boolean(document.fullscreenElement);
      setFullscreen(on);
      void catatAktivitas({ attemptId: session.attemptId, type: on ? "MASUK_FULLSCREEN" : "KELUAR_FULLSCREEN" });
    };
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (pendingRef.current.size > 0) e.preventDefault();
    };
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("fullscreenchange", onFullscreen);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("fullscreenchange", onFullscreen);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [session.attemptId, flush]);

  const paletteSections: PaletteSection[] = sections.map((s) => ({
    id: s.id,
    title: s.title,
    state: session.mode === "bebas" || s.id === activeSectionId ? "aktif" : s.submittedAt ? "selesai" : "belum-dibuka",
    questions: session.questions.filter((q) => q.sectionId === s.id).map((q) => ({ id: q.id, number: q.number, status: status(q.id) })),
  }));

  const low = remainingSec !== null && remainingSec <= 5 * 60;
  const currentAnswer = answers[question.id] ?? { ...EMPTY_ANSWER, isDoubtful: false };
  const doubtful = currentAnswer.isDoubtful;
  const finishLabel = isLastWindow ? "Kumpulkan tryout" : "Selesaikan subtes";

  const palette = (
    <div className="flex flex-col gap-5">
      <QuestionPalette sections={paletteSections} currentId={currentId} onSelect={select} />
      <dl className="grid grid-cols-3 gap-2 rounded-lg bg-secondary p-3 text-center text-sm tabular-nums">
        <div>
          <dt className="text-muted-foreground">Dijawab</dt>
          <dd className="text-lg font-bold">{visible.length - counts.unanswered}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Ragu</dt>
          <dd className="text-lg font-bold">{counts.doubtful}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Kosong</dt>
          <dd className="text-lg font-bold">{counts.unanswered}</dd>
        </div>
      </dl>
      <Button
        onClick={() => {
          setPaletteOpen(false);
          setConfirm(isLastWindow ? "kumpulkan" : "subtes");
        }}
        disabled={busy}
      >
        {finishLabel}
      </Button>
    </div>
  );

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Navbar ujian (I.3.1): nama tryout, nomor soal, timer, keluar. */}
      <header className="sticky top-0 z-30 border-b border-border bg-background" /* taste-skill-ignore: pemisah header sticky dari soal yang digulir */>
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <div className="flex min-w-0 flex-1 flex-col">
            <p className="truncate font-bold">{session.exam.title}</p>
            <p className="truncate text-sm text-muted-foreground tabular-nums">
              {session.mode === "berurutan" ? `${activeSection.title}, ` : ""}soal {question.number} dari {session.questions.length}
            </p>
          </div>
          <div
            className={cn(
              "flex items-center gap-2 rounded-lg border-2 px-3 py-1.5 text-xl font-bold tabular-nums",
              low ? "border-destructive text-destructive" : "border-border",
            )}
            aria-label={remainingSec === null ? "Memuat sisa waktu" : `Sisa waktu ${formatCountdown(remainingSec)}`}
            role="timer"
          >
            <Clock aria-hidden="true" className="size-5" />
            <span aria-hidden="true">{remainingSec === null ? "--:--" : formatCountdown(remainingSec)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label={fullscreen ? "Keluar dari layar penuh" : "Layar penuh"}
              onClick={() => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()).catch(() => undefined)}
              className="hidden sm:inline-flex"
            >
              {fullscreen ? <Minimize aria-hidden="true" /> : <Maximize aria-hidden="true" />}
            </Button>
            <Button variant="outline" onClick={() => setConfirm("keluar")} aria-label="Keluar dari ujian">
              <LogOut aria-hidden="true" data-icon="inline-start" />
              <span className="hidden sm:inline">Keluar</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="sr-only" aria-live="polite">
        {announce}
      </div>

      <div className="mx-auto grid w-full max-w-7xl flex-1 gap-8 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_19rem] lg:py-8">
        <main id="konten" className="flex min-w-0 flex-col gap-6 pb-24 lg:pb-0">
          {tabLeaves > 0 && (
            <p className="flex items-start gap-2 rounded-lg border-2 border-warning bg-warning/10 px-4 py-3 text-sm" role="status">
              <CircleAlert aria-hidden="true" className="mt-0.5 size-4.5 shrink-0 text-warning" />
              Kamu meninggalkan halaman ujian {tabLeaves} kali. Setiap perpindahan tab dicatat.
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 id="soal-judul" tabIndex={-1} className="text-2xl font-bold tabular-nums focus:outline-none">
              Soal {question.number}
              {doubtful && (
                <span className="ml-3 inline-flex items-center gap-1 align-middle text-base font-semibold text-warning">
                  <Flag aria-hidden="true" className="size-4" /> Ragu-ragu
                </span>
              )}
            </h1>
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {save.kind === "saving" && "Menyimpan…"}
              {save.kind === "saved" && `Tersimpan ${jam.format(save.at)}`}
              {save.kind === "error" && <span className="font-semibold text-destructive">Gagal menyimpan, mencoba lagi…</span>}
            </p>
          </div>

          <div className="rich-text max-w-[75ch] text-lg leading-relaxed" dangerouslySetInnerHTML={{ __html: question.bodyHtml }} />
          {question.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- gambar soal dari Cloudinary, ukuran bebas
            <img src={question.imageUrl} alt={`Gambar soal ${question.number}`} className="max-h-96 w-auto max-w-full rounded-lg border border-border" />
          )}

          <QuestionAnswer
            key={question.id}
            question={question}
            value={currentAnswer}
            onChange={(v) => change(question.id, v)}
          />

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button variant="outline" disabled={index === 0} onClick={() => select(visible[index - 1].id)} className="hidden lg:inline-flex">
              <ChevronLeft aria-hidden="true" data-icon="inline-start" />
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              aria-pressed={doubtful}
              onClick={() => change(question.id, { isDoubtful: !doubtful })}
              className={cn(doubtful && "border-warning bg-warning/12 hover:bg-warning/20")}
            >
              <Flag aria-hidden="true" data-icon="inline-start" className={cn(doubtful && "text-warning")} />
              Ragu-ragu
            </Button>
            {isAnswered(currentAnswer) && (
              <Button variant="ghost" onClick={() => change(question.id, { ...EMPTY_ANSWER })}>
                Kosongkan jawaban
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() =>
                void flush().then(() => {
                  if (pendingRef.current.size === 0) toast.success(`Jawaban soal ${question.number} tersimpan.`);
                })
              }
            >
              <Save aria-hidden="true" data-icon="inline-start" />
              Simpan jawaban
            </Button>
            <div className="ml-auto hidden lg:block">
              {index < visible.length - 1 ? (
                <Button onClick={() => select(visible[index + 1].id)}>
                  Berikutnya
                  <ChevronRight aria-hidden="true" data-icon="inline-end" />
                </Button>
              ) : (
                <Button onClick={() => setConfirm(isLastWindow ? "kumpulkan" : "subtes")} disabled={busy}>
                  {finishLabel}
                </Button>
              )}
            </div>
          </div>
        </main>

        <aside aria-label="Daftar soal" className="hidden self-start lg:sticky lg:top-24 lg:block">
          {palette}
        </aside>
      </div>

      {/* Mobile: daftar soal di sheet bawah. */}
      {/* Mobile: sebelumnya/berikutnya dan daftar soal di bar bawah agar mudah dijangkau jempol. */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-2 border-t border-border bg-background px-4 py-3 lg:hidden" /* taste-skill-ignore: pemisah bar tetap di bawah */>
        <Button variant="outline" size="icon" aria-label="Soal sebelumnya" disabled={index === 0} onClick={() => select(visible[index - 1].id)}>
          <ChevronLeft aria-hidden="true" />
        </Button>
        <Sheet open={paletteOpen} onOpenChange={setPaletteOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="min-w-0 flex-1">
              <LayoutGrid aria-hidden="true" data-icon="inline-start" />
              Daftar soal ({visible.length - counts.unanswered}/{visible.length} dijawab)
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto px-4 pb-6">
            <SheetHeader className="px-0">
              <SheetTitle>Daftar soal</SheetTitle>
            </SheetHeader>
            {palette}
          </SheetContent>
        </Sheet>
        {index < visible.length - 1 ? (
          <Button size="icon" aria-label="Soal berikutnya" onClick={() => select(visible[index + 1].id)}>
            <ChevronRight aria-hidden="true" />
          </Button>
        ) : (
          <Button onClick={() => setConfirm(isLastWindow ? "kumpulkan" : "subtes")} disabled={busy}>
            {isLastWindow ? "Kumpulkan" : "Selesai"}
          </Button>
        )}
      </div>

      <Dialog open={confirm !== null} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent className="gap-5 p-6 sm:max-w-md">
          <DialogHeader className="text-left">
            <DialogTitle className="text-lg font-bold">
              {confirm === "kumpulkan" ? "Kumpulkan tryout?" : confirm === "subtes" ? `Selesaikan ${activeSection.title}?` : "Keluar dari halaman ujian?"}
            </DialogTitle>
            <DialogDescription className="text-base">
              {confirm === "keluar"
                ? "Jawabanmu sudah tersimpan, tetapi waktu tetap berjalan. Kamu bisa melanjutkan dari halaman tryout selama waktu masih ada."
                : confirm === "subtes"
                  ? "Subtes yang sudah diselesaikan tidak bisa dibuka lagi. Subtes berikutnya langsung dimulai."
                  : "Setelah dikumpulkan, jawaban tidak bisa diubah."}
            </DialogDescription>
          </DialogHeader>
          {confirm !== "keluar" && (counts.unanswered > 0 || counts.doubtful > 0) && (
            <p className="rounded-lg bg-warning/10 px-4 py-3 tabular-nums" role="status">
              {counts.unanswered > 0 && (
                <>
                  Masih ada <strong>{counts.unanswered} soal belum dijawab</strong>
                  {confirm === "subtes" ? " di subtes ini" : ""}.{" "}
                </>
              )}
              {counts.doubtful > 0 && (
                <>
                  <strong>{counts.doubtful} soal</strong> ditandai ragu-ragu.
                </>
              )}
            </p>
          )}
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline">Kembali mengerjakan</Button>
            </DialogClose>
            <Button
              disabled={busy}
              onClick={() => {
                const action = confirm;
                setConfirm(null);
                if (action === "kumpulkan") submit(false);
                else if (action === "subtes") nextSection(false);
                else
                  startBusy(async () => {
                    finishingRef.current = true;
                    await flush();
                    router.push("/dashboard/tryout");
                  });
              }}
            >
              {confirm === "kumpulkan" ? "Ya, kumpulkan" : confirm === "subtes" ? "Ya, selesaikan subtes" : "Ya, keluar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
