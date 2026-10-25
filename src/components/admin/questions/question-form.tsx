"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { FormSection } from "@/components/admin/form-fields";
import { MediaUploader, type MediaValue } from "@/components/admin/media-uploader";
import { useAdminSubmit } from "@/components/admin/use-admin-submit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { describedBy, Field, FormAlert } from "@/features/auth/components/form-parts";
import { NativeSelect } from "@/features/auth/components/native-select";
import { simpanSoal } from "@/features/admin/questions/actions";
import {
  difficultyLabel,
  OPTION_LABELS,
  QUESTION_TYPES,
  questionSchema,
  questionTypeLabel,
  type QuestionInput,
  type QuestionOutput,
} from "@/features/admin/questions/schemas";

const HTML_HINT = "HTML sederhana boleh: <strong>, <em>, <sup>, <sub>, <ul>, <ol>, <table>. Skrip dan gaya dibuang otomatis.";

/** Editor soal bank soal (M.5.1): field menyesuaikan jenis soal. */
export function QuestionForm({
  defaults,
  categories,
  subjects,
  topics,
  image,
}: {
  defaults: QuestionInput;
  categories: { id: string; name: string }[];
  subjects: string[];
  topics: string[];
  image: MediaValue | null;
}) {
  const router = useRouter();
  const [media, setMedia] = useState<MediaValue | null>(image);
  const form = useForm<QuestionInput, unknown, QuestionOutput>({ resolver: zodResolver(questionSchema), defaultValues: defaults });
  const { errors } = form.formState;
  const type = useWatch({ control: form.control, name: "type" });
  const options = useWatch({ control: form.control, name: "options" });
  const isChoice = type === "PG_TUNGGAL" || type === "PG_JAMAK" || type === "BENAR_SALAH";
  const f = (name: keyof QuestionInput) => ({ id: `q-${name}`, "aria-invalid": Boolean(errors[name]), "aria-describedby": describedBy(`q-${name}`, errors[name]?.message) });
  const { pending, error, onSubmit } = useAdminSubmit(form, simpanSoal, (data) => {
    toast.success(defaults.id ? "Soal disimpan." : "Soal dibuat.");
    if (defaults.id) router.refresh();
    else router.push(`/admin/bank-soal/${data.id}`);
  });

  /** Benar/salah selalu dua opsi tetap; PG tunggal hanya boleh satu kunci. */
  function onTypeChange(next: string) {
    if (next === "BENAR_SALAH") {
      const correctIsSalah = options?.[1]?.isCorrect && !options?.[0]?.isCorrect;
      form.setValue(
        "options",
        OPTION_LABELS.map((_, i) => ({ body: i === 0 ? "Benar" : i === 1 ? "Salah" : "", isCorrect: i === (correctIsSalah ? 1 : 0), score: "" })),
      );
    }
  }

  function setCorrect(i: number, checked: boolean) {
    if (type === "PG_JAMAK") return form.setValue(`options.${i}.isCorrect`, checked);
    OPTION_LABELS.forEach((_, j) => form.setValue(`options.${j}.isCorrect`, j === i));
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex max-w-3xl flex-col gap-6">
      <FormAlert message={error} />
      <FormSection title="Klasifikasi">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Kategori ujian" htmlFor="q-categoryId" error={errors.categoryId?.message}>
            <NativeSelect {...f("categoryId")} {...form.register("categoryId")}>
              <option value="" disabled>
                Pilih kategori
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Jenis soal" htmlFor="q-type" error={errors.type?.message}>
            <NativeSelect {...f("type")} {...form.register("type", { onChange: (e) => onTypeChange(e.target.value) })}>
              {QUESTION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {questionTypeLabel[t]}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Mata pelajaran" htmlFor="q-subject" error={errors.subject?.message}>
            <Input list="daftar-mapel" autoComplete="off" {...f("subject")} {...form.register("subject")} />
          </Field>
          <Field label="Topik" htmlFor="q-topic" error={errors.topic?.message} hint="Topik dipakai analisis kemampuan siswa.">
            <Input list="daftar-topik" autoComplete="off" {...f("topic")} {...form.register("topic")} />
          </Field>
          <Field label="Tingkat kesulitan" htmlFor="q-difficulty" error={errors.difficulty?.message}>
            <NativeSelect {...f("difficulty")} {...form.register("difficulty")}>
              {Object.entries(difficultyLabel).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Bobot" htmlFor="q-weight" error={errors.weight?.message}>
              <Input inputMode="decimal" {...f("weight")} {...form.register("weight")} />
            </Field>
            <Field label="Status" htmlFor="q-status" error={errors.status?.message}>
              <NativeSelect {...f("status")} {...form.register("status")}>
                <option value="DRAF">Draf</option>
                <option value="TERBIT">Terbit</option>
                <option value="ARSIP">Arsip</option>
              </NativeSelect>
            </Field>
          </div>
        </div>
        <datalist id="daftar-mapel">
          {subjects.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        <datalist id="daftar-topik">
          {topics.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
      </FormSection>

      <FormSection title="Pertanyaan">
        <Field label="Isi pertanyaan" htmlFor="q-body" error={errors.body?.message} hint={HTML_HINT}>
          <Textarea rows={5} className="min-h-32" {...f("body")} {...form.register("body")} />
        </Field>
        <MediaUploader
          label="Gambar soal (opsional)"
          folder="soal"
          kind="image"
          value={media}
          onChange={(v) => {
            setMedia(v);
            form.setValue("imageId", v?.id ?? null, { shouldDirty: true });
          }}
        />
      </FormSection>

      <FormSection
        title="Kunci jawaban"
        description={
          isChoice
            ? type === "PG_JAMAK"
              ? "Centang semua jawaban benar."
              : "Pilih satu jawaban benar. Untuk soal bergradasi (mis. TKP), isi skor setiap opsi sebagai gantinya."
            : type === "ESSAY"
              ? "Essay dinilai admin dari menu Penilaian setelah siswa mengumpulkan."
              : undefined
        }
      >
        {isChoice && (
          <div className="flex flex-col gap-3" role="group" aria-labelledby="judul-opsi">
            <span id="judul-opsi" className="sr-only">
              Opsi jawaban
            </span>
            {OPTION_LABELS.map((label, i) => {
              if (type === "BENAR_SALAH" && i > 1) return null;
              return (
                <div key={label} className="grid grid-cols-[2rem_minmax(0,1fr)] items-start gap-3 sm:grid-cols-[2rem_minmax(0,1fr)_auto_5rem]">
                  <span className="mt-2 grid size-8 place-items-center rounded-lg bg-secondary font-bold">{label}</span>
                  <div className="flex flex-col gap-1">
                    <label htmlFor={`opsi-${i}`} className="sr-only">
                      Opsi {label}
                    </label>
                    <Input
                      id={`opsi-${i}`}
                      readOnly={type === "BENAR_SALAH"}
                      placeholder={i < 2 ? "Wajib diisi" : "Kosongkan bila tidak dipakai"}
                      {...form.register(`options.${i}.body`)}
                    />
                  </div>
                  <label className="col-start-2 flex items-center gap-2 text-sm font-semibold sm:col-start-auto sm:mt-2.5">
                    <input
                      type={type === "PG_JAMAK" ? "checkbox" : "radio"}
                      name="kunci"
                      className="size-4.5 accent-primary"
                      checked={Boolean(options?.[i]?.isCorrect)}
                      onChange={(e) => setCorrect(i, e.target.checked)}
                    />
                    Jawaban benar
                  </label>
                  {type === "PG_TUNGGAL" && (
                    <div className="col-start-2 sm:col-start-auto">
                      <label htmlFor={`skor-${i}`} className="sr-only">
                        Skor opsi {label}
                      </label>
                      <Input id={`skor-${i}`} inputMode="decimal" placeholder="Skor" {...form.register(`options.${i}.score`)} />
                    </div>
                  )}
                </div>
              );
            })}
            {errors.options && (
              <p role="alert" className="text-sm text-destructive">
                {errors.options.message ?? errors.options.root?.message}
              </p>
            )}
          </div>
        )}
        {type === "ISIAN_SINGKAT" && (
          <Field label="Jawaban benar" htmlFor="q-correctText" error={errors.correctText?.message} hint="Beberapa jawaban yang diterima dipisah |, mis. rendah|pendek. Huruf besar/kecil dan spasi berlebih diabaikan.">
            <Input autoComplete="off" {...f("correctText")} {...form.register("correctText")} />
          </Field>
        )}
        {type === "NUMERIK" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Jawaban benar (angka)" htmlFor="q-correctNumber" error={errors.correctNumber?.message} hint="Desimal boleh memakai koma.">
              <Input inputMode="decimal" {...f("correctNumber")} {...form.register("correctNumber")} />
            </Field>
            <Field label="Toleransi (opsional)" htmlFor="q-tolerance" error={errors.tolerance?.message} hint="Selisih yang masih dianggap benar.">
              <Input inputMode="decimal" {...f("tolerance")} {...form.register("tolerance")} />
            </Field>
          </div>
        )}
      </FormSection>

      <FormSection title="Pembahasan">
        <Field label="Pembahasan" htmlFor="q-explanation" error={errors.explanation?.message} hint={HTML_HINT}>
          <Textarea rows={5} className="min-h-32" {...f("explanation")} {...form.register("explanation")} />
        </Field>
        <Field label="URL video pembahasan (opsional)" htmlFor="q-explanationVideoUrl" error={errors.explanationVideoUrl?.message} hint="YouTube unlisted, Vimeo, atau URL lain yang diawali https://.">
          <Input type="url" inputMode="url" {...f("explanationVideoUrl")} {...form.register("explanationVideoUrl")} />
        </Field>
      </FormSection>

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Menyimpan…" : defaults.id ? "Simpan soal" : "Buat soal"}
      </Button>
    </form>
  );
}
