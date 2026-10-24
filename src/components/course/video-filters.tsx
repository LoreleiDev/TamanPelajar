"use client";

import { ChevronDown } from "lucide-react";
import Form from "next/form";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { DIFFICULTY_LABELS, DURATION_BUCKETS, WATCH_STATUS, type VideoFilter } from "@/features/video/schemas";

function Select({ name, label, value, children }: { name: string; label: string; value?: string; children: ReactNode }) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5 text-sm font-semibold">
      {label}
      <span className="relative">
        <select
          name={name}
          defaultValue={value ?? ""}
          className="h-10 w-full appearance-none rounded-lg border border-input bg-background pr-9 pl-3 text-base font-normal outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">Semua</option>
          {children}
        </select>
        <ChevronDown aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" />
      </span>
    </label>
  );
}

/** Filter pustaka video (H.1): kategori, mata pelajaran, durasi, kesulitan, status tonton. */
export function VideoFilters({
  filter,
  categories,
  subjects,
  loggedIn,
}: {
  filter: VideoFilter;
  categories: string[];
  subjects: string[];
  loggedIn: boolean;
}) {
  return (
    <Form
      action="/video"
      scroll={false}
      replace
      onChange={(e) => e.currentTarget.requestSubmit()}
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
      aria-label="Filter video"
    >
      {filter.q && <input type="hidden" name="q" value={filter.q} />}
      <Select name="kategori" label="Kategori" value={filter.kategori}>
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </Select>
      <Select name="mapel" label="Mata pelajaran" value={filter.mapel}>
        {subjects.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </Select>
      <Select name="durasi" label="Durasi" value={filter.durasi}>
        {Object.entries(DURATION_BUCKETS).map(([k, v]) => (
          <option key={k} value={k}>
            {v.label}
          </option>
        ))}
      </Select>
      <Select name="kesulitan" label="Tingkat kesulitan" value={filter.kesulitan}>
        {Object.entries(DIFFICULTY_LABELS).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </Select>
      {loggedIn && (
        <Select name="status" label="Status" value={filter.status}>
          {Object.entries(WATCH_STATUS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
      )}
      <Button type="submit" className="sr-only focus:not-sr-only">
        Terapkan filter
      </Button>
    </Form>
  );
}
