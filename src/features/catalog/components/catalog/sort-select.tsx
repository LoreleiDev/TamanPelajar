"use client";

import { ChevronDown } from "lucide-react";

import { SORT_OPTIONS, sortLabels } from "@/features/catalog/labels";
import type { SortOption } from "@/features/catalog/types";

/**
 * Urutan katalog (D.2.3). Terhubung ke form filter desktop lewat atribut `form`,
 * sehingga filter yang aktif ikut terkirim.
 */
export function SortSelect({ formId, value }: { formId: string; value: SortOption }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="shrink-0 text-muted-foreground">Urutkan</span>
      <span className="relative">
        <select
          name="urut"
          form={formId}
          defaultValue={value}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
          className="h-10 appearance-none rounded-lg border border-input bg-background pr-9 pl-3 text-base font-semibold outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o} value={o}>
              {sortLabels[o]}
            </option>
          ))}
        </select>
        <ChevronDown aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" />
      </span>
    </label>
  );
}
