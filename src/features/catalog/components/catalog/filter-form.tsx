"use client";

import Form from "next/form";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  EDUCATION_LEVELS,
  PRICE_STEPS,
  PROGRAM_TYPES,
  RATING_STEPS,
  educationLevelLabels,
  programTypeLabels,
} from "@/features/catalog/labels";
import type { CatalogFilter, Category } from "@/features/catalog/types";
import { formatRupiah } from "@/lib/format";

const rating = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });

function Group({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-2.5">
      <legend className="mb-2 text-sm font-bold">{legend}</legend>
      {children}
    </fieldset>
  );
}

function Option({
  type,
  name,
  value,
  checked,
  label,
  hint,
}: {
  type: "checkbox" | "radio";
  name: string;
  value: string;
  checked: boolean;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-[0.9375rem]">
      <input
        type={type}
        name={name}
        value={value}
        defaultChecked={checked}
        className="size-4 shrink-0 accent-primary"
      />
      <span className="flex-1">{label}</span>
      {hint && <span className="text-sm text-muted-foreground tabular-nums">{hint}</span>}
    </label>
  );
}

/**
 * Filter katalog (D.2.2) sebagai form GET. Di desktop setiap perubahan langsung
 * menerapkan filter; di sheet mobile filter diterapkan lewat tombol.
 * Tanpa JavaScript, form tetap terkirim dengan tombol "Terapkan".
 */
export function FilterForm({
  id,
  filter,
  categories,
  autoSubmit,
}: {
  id: string;
  filter: CatalogFilter;
  categories: (Pick<Category, "slug" | "name"> & { productCount: number })[];
  autoSubmit: boolean;
}) {
  return (
    <Form
      id={id}
      action="/program"
      scroll={false}
      replace
      onChange={autoSubmit ? (e) => e.currentTarget.requestSubmit() : undefined}
      className="flex flex-col gap-7"
    >
      {filter.q && <input type="hidden" name="q" value={filter.q} />}
      {/* Di desktop, pilihan urutan terhubung lewat atribut form pada select-nya. */}
      {!autoSubmit && filter.urut && <input type="hidden" name="urut" value={filter.urut} />}

      <Group legend="Program">
        {categories.map((c) => (
          <Option
            key={c.slug}
            type="checkbox"
            name="kategori"
            value={c.slug}
            checked={filter.kategori?.includes(c.slug) ?? false}
            label={c.name}
            hint={String(c.productCount)}
          />
        ))}
      </Group>

      <Group legend="Jenis program">
        {PROGRAM_TYPES.map((t) => (
          <Option
            key={t}
            type="checkbox"
            name="jenis"
            value={t}
            checked={filter.jenis?.includes(t) ?? false}
            label={programTypeLabels[t]}
          />
        ))}
      </Group>

      <Group legend="Tingkat pendidikan">
        {EDUCATION_LEVELS.map((l) => (
          <Option
            key={l}
            type="checkbox"
            name="jenjang"
            value={l}
            checked={filter.jenjang?.includes(l) ?? false}
            label={educationLevelLabels[l]}
          />
        ))}
      </Group>

      <Group legend="Harga">
        <Option type="radio" name="hargaMaks" value="" checked={!filter.hargaMaks} label="Semua harga" />
        {PRICE_STEPS.map((p) => (
          <Option
            key={p}
            type="radio"
            name="hargaMaks"
            value={String(p)}
            checked={filter.hargaMaks === p}
            label={`Sampai ${formatRupiah(p)}`}
          />
        ))}
      </Group>

      <Group legend="Rating">
        <Option type="radio" name="ratingMin" value="" checked={!filter.ratingMin} label="Semua rating" />
        {RATING_STEPS.map((r) => (
          <Option
            key={r}
            type="radio"
            name="ratingMin"
            value={String(r)}
            checked={filter.ratingMin === r}
            label={`${rating.format(r)} ke atas`}
          />
        ))}
      </Group>

      <Button type="submit" size="lg" className={autoSubmit ? "sr-only focus:not-sr-only" : undefined}>
        Terapkan filter
      </Button>
    </Form>
  );
}
