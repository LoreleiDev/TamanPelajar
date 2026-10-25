"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { QuestionPicker } from "@/components/admin/exams/question-picker";
import { FormSection } from "@/components/admin/form-fields";
import { MediaUploader, type MediaValue } from "@/components/admin/media-uploader";
import { SortableList } from "@/components/admin/sortable-list";
import { useAdminSubmit } from "@/components/admin/use-admin-submit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { describedBy, Field, FormAlert } from "@/features/auth/components/form-parts";
import { NativeSelect } from "@/features/auth/components/native-select";
import {
  cariSoalKuis,
  hapusLampiran,
  keluarkanSoalKuis,
  simpanKuis,
  simpanMateri,
  tambahLampiran,
  tambahSoalKuis,
  urutkanSoalKuis,
} from "@/features/admin/courses/actions";
import { LESSON_TYPES, lessonSchema, lessonTypeLabel, quizSettingsSchema, type LessonInput, type QuizSettingsInput } from "@/features/admin/courses/schemas";
import { difficultyLabel, questionTypeLabel, type QuestionTypeCode } from "@/features/admin/questions/schemas";
import { formatClock } from "@/lib/format";

const HTML_HINT = "HTML sederhana boleh: <p>, <strong>, <em>, <ul>, <ol>, <h2>, <h3>, <a>, <table>. Skrip dan gaya dibuang otomatis.";

/** Isi materi (L.2.3–L.2.4): jenis, bab, video dari pustaka, bacaan/instruksi, durasi. */
export function LessonForm({
  defaults,
  sections,
  videos,
}: {
  defaults: LessonInput;
  sections: { id: string; title: string }[];
  videos: { id: string; title: string; subject: string; durationSec: number }[];
}) {
  const router = useRouter();
  const form = useForm({ resolver: zodResolver(lessonSchema), defaultValues: defaults });
  const { errors } = form.formState;
  const type = useWatch({ control: form.control, name: "type" });
  const f = (name: keyof LessonInput) => ({ id: `l-${name}`, "aria-invalid": Boolean(errors[name]), "aria-describedby": describedBy(`l-${name}`, errors[name]?.message) });
  const { pending, error, onSubmit } = useAdminSubmit(form, (v: LessonInput) => simpanMateri(v), () => {
    toast.success("Materi disimpan.");
    router.refresh();
  });

  return (
    <form noValidate onSubmit={onSubmit} className="flex max-w-3xl flex-col gap-6">
      <FormAlert message={error} />
      <FormSection title="Materi">
        <Field label="Judul" htmlFor="l-title" error={errors.title?.message}>
          <Input autoComplete="off" {...f("title")} {...form.register("title")} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Jenis" htmlFor="l-type" error={errors.type?.message}>
            <NativeSelect {...f("type")} {...form.register("type")}>
              {LESSON_TYPES.map((t) => (
                <option key={t} value={t}>
                  {lessonTypeLabel[t]}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Bab" htmlFor="l-sectionId" error={errors.sectionId?.message}>
            <NativeSelect {...f("sectionId")} {...form.register("sectionId")}>
              {sections.map((s, i) => (
                <option key={s.id} value={s.id}>
                  Bab {i + 1}. {s.title}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Slug" htmlFor="l-slug" error={errors.slug?.message}>
            <Input autoComplete="off" {...f("slug")} {...form.register("slug")} />
          </Field>
        </div>
        <Field label="Ringkasan (opsional)" htmlFor="l-summary" error={errors.summary?.message}>
          <Input autoComplete="off" {...f("summary")} {...form.register("summary")} />
        </Field>
        {type === "VIDEO" ? (
          <Field label="Video" htmlFor="l-videoId" error={errors.videoId?.message} hint="Video diambil dari menu Video. Durasi materi mengikuti durasi video.">
            <NativeSelect {...f("videoId")} {...form.register("videoId")}>
              <option value="">Pilih video</option>
              {videos.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.subject}: {v.title} ({formatClock(v.durationSec)})
                </option>
              ))}
            </NativeSelect>
          </Field>
        ) : (
          <Field label="Perkiraan durasi (menit, opsional)" htmlFor="l-durationMin" error={errors.durationMin?.message}>
            <Input inputMode="numeric" className="sm:max-w-40" {...f("durationMin")} {...form.register("durationMin")} />
          </Field>
        )}
        <Field
          label={type === "TUGAS" ? "Instruksi tugas" : type === "TEKS" ? "Isi bacaan" : "Catatan materi (opsional)"}
          htmlFor="l-content"
          error={errors.content?.message}
          hint={HTML_HINT}
        >
          <Textarea rows={8} className="min-h-40" {...f("content")} {...form.register("content")} />
        </Field>
        {type === "PDF" && <p className="text-sm text-muted-foreground">Unggah file PDF di bagian Lampiran di bawah setelah menyimpan.</p>}
      </FormSection>
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Menyimpan…" : "Simpan materi"}
      </Button>
    </form>
  );
}

/** Lampiran PDF materi (L.2.3): diunggah sebagai file berbayar (delivery authenticated). */
export function MaterialsEditor({ lessonId, materials }: { lessonId: string; materials: { id: string; title: string; bytes: number }[] }) {
  const router = useRouter();
  const [file, setFile] = useState<MediaValue | null>(null);
  const [title, setTitle] = useState("");
  const [pending, start] = useTransition();

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      {materials.length > 0 && (
        <ul className="flex flex-col gap-2">
          {materials.map((m) => (
            <li key={m.id} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2">
              <FileText aria-hidden="true" className="size-5 text-primary" />
              <span className="min-w-0 flex-1">
                <span className="font-semibold">{m.title}</span>
                <span className="ml-2 text-sm text-muted-foreground tabular-nums">{(m.bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB</span>
              </span>
              <Button
                size="icon"
                variant="ghost"
                aria-label={`Hapus lampiran ${m.title}`}
                className="text-muted-foreground hover:text-destructive"
                onClick={() =>
                  start(async () => {
                    const r = await hapusLampiran({ id: m.id });
                    if (!r.ok) return void toast.error(r.error);
                    toast.success("Lampiran dihapus.");
                    router.refresh();
                  })
                }
              >
                <X />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-col gap-3 rounded-xl bg-secondary p-4">
        <MediaUploader
          label="File PDF"
          folder="kelas"
          kind="pdf"
          value={file}
          hint="Hanya siswa yang punya akses materi ini yang bisa mengunduh, lewat tautan berumur 5 menit."
          onChange={(v) => {
            setFile(v);
            if (v?.name && !title) setTitle(v.name.replace(/\.pdf$/i, ""));
          }}
        />
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex min-w-56 flex-1 flex-col gap-1">
            <label htmlFor="judul-lampiran" className="text-sm font-semibold">
              Judul lampiran
            </label>
            <Input id="judul-lampiran" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Mis. Ringkasan bab 3 (PDF)" />
          </div>
          <Button
            disabled={pending || !file || title.trim().length < 3}
            onClick={() =>
              start(async () => {
                const r = await tambahLampiran({ lessonId, mediaId: file!.id, title });
                if (!r.ok) return void toast.error(r.fieldErrors?.title ?? r.error);
                toast.success("Lampiran ditambahkan.");
                setFile(null);
                setTitle("");
                router.refresh();
              })
            }
          >
            Simpan lampiran
          </Button>
        </div>
      </div>
    </div>
  );
}

interface QuizQ {
  id: string;
  excerpt: string;
  type: QuestionTypeCode;
  topic: string;
  difficulty: "MUDAH" | "SEDANG" | "SULIT";
  draft: boolean;
}

/** Kuis setelah materi (L.2.5, G.4.5): nilai lulus dan soal dari bank soal. */
export function QuizEditor({
  quiz,
  questions,
  attempts,
  categories,
  categoryId,
  subjects,
}: {
  quiz: QuizSettingsInput;
  questions: QuizQ[];
  attempts: number;
  categories: { id: string; name: string }[];
  categoryId: string;
  subjects: string[];
}) {
  const router = useRouter();
  const form = useForm({ resolver: zodResolver(quizSettingsSchema), defaultValues: quiz });
  const { errors } = form.formState;
  const { pending, error, onSubmit } = useAdminSubmit(form, (v: QuizSettingsInput) => simpanKuis(v), () => {
    toast.success("Pengaturan kuis disimpan.");
    router.refresh();
  });
  const run = async (p: Promise<{ ok: boolean; error?: string }>, msg?: string) => {
    const r = await p;
    if (!r.ok) {
      toast.error(r.error);
      return false;
    }
    if (msg) toast.success(msg);
    router.refresh();
    return true;
  };

  return (
    <div className="flex max-w-3xl flex-col gap-5">
      <form noValidate onSubmit={onSubmit} className="flex flex-wrap items-end gap-3">
        <FormAlert message={error} />
        <div className="min-w-56 flex-1">
          <Field label="Judul kuis" htmlFor="k-title" error={errors.title?.message}>
            <Input id="k-title" aria-invalid={Boolean(errors.title)} {...form.register("title")} />
          </Field>
        </div>
        <div className="w-32">
          <Field label="Nilai lulus" htmlFor="k-passingScore" error={errors.passingScore?.message}>
            <Input id="k-passingScore" inputMode="numeric" aria-invalid={Boolean(errors.passingScore)} {...form.register("passingScore")} />
          </Field>
        </div>
        <Button type="submit" variant="outline" disabled={pending}>
          Simpan
        </Button>
      </form>
      <p className="text-sm text-muted-foreground">
        {questions.length} soal, {attempts} percobaan siswa. Nilai kuis 0–100 dari persentase jawaban benar. Soal essay tidak bisa dipakai karena kuis dinilai otomatis.
      </p>
      {questions.length > 0 && (
        <SortableList
          items={questions}
          label="Soal kuis"
          itemLabel={(q) => `soal ${questions.indexOf(q) + 1}`}
          className="divide-y divide-border overflow-hidden rounded-lg border border-border"
          onReorder={(ids) => run(urutkanSoalKuis({ parentId: quiz.quizId, ids }))}
          renderItem={(q, handle) => (
            <div className="flex items-start gap-2 px-2 py-2.5">
              {handle}
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2">{q.excerpt}</p>
                <p className="text-sm text-muted-foreground">
                  {questionTypeLabel[q.type]} · {q.topic} · {difficultyLabel[q.difficulty]}
                  {q.draft && <span className="font-semibold text-warning"> · masih draf</span>}
                </p>
              </div>
              <Button size="icon" variant="ghost" aria-label="Keluarkan soal dari kuis" className="shrink-0 text-muted-foreground hover:text-destructive" onClick={() => run(keluarkanSoalKuis({ id: q.id }), "Soal dikeluarkan.")}>
                <X />
              </Button>
            </div>
          )}
        />
      )}
      <div>
        <QuestionPicker
          id={quiz.quizId}
          targetTitle={quiz.title}
          categories={categories}
          defaultCategoryId={categoryId}
          subjects={subjects}
          note="Soal yang sudah ada di kuis ini dan soal essay tidak ditampilkan."
          search={(filter) => cariSoalKuis({ quizId: quiz.quizId, ...filter })}
          add={(questionIds) => tambahSoalKuis({ quizId: quiz.quizId, questionIds })}
        />
      </div>
    </div>
  );
}
