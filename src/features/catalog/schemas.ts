// Parsing parameter URL katalog (D.2). Nilai yang tidak dikenal dibuang, bukan
// menghasilkan error, karena URL bisa diketik atau dibagikan sembarangan.

import { EDUCATION_LEVELS, PRICE_STEPS, PROGRAM_TYPES, RATING_STEPS, SORT_OPTIONS } from "./labels";
import type { CatalogFilter, EducationLevel, ProgramType, SortOption } from "./types";

export type SearchParams = Record<string, string | string[] | undefined>;

const list = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v : v ? [v] : []).flatMap((x) => x.split(",")).map((x) => x.trim()).filter(Boolean);

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

function positiveNumber(v: string | undefined) {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/** `categorySlugs` dari database; slug lain dibuang. */
export function parseCatalogFilter(params: SearchParams, categorySlugs: string[]): CatalogFilter {
  const slugs = new Set(categorySlugs);
  const q = first(params.q)?.trim().slice(0, 80);
  const urut = first(params.urut) as SortOption | undefined;
  const hargaMaks = positiveNumber(first(params.hargaMaks));
  const ratingMin = positiveNumber(first(params.ratingMin));
  const halaman = positiveNumber(first(params.halaman));

  return {
    q: q || undefined,
    kategori: list(params.kategori).filter((s) => slugs.has(s)),
    jenis: list(params.jenis).filter((s): s is ProgramType => PROGRAM_TYPES.includes(s as ProgramType)),
    jenjang: list(params.jenjang).filter((s): s is EducationLevel =>
      EDUCATION_LEVELS.includes(s as EducationLevel),
    ),
    hargaMaks: hargaMaks && PRICE_STEPS.includes(hargaMaks) ? hargaMaks : undefined,
    ratingMin: ratingMin && RATING_STEPS.includes(ratingMin) ? ratingMin : undefined,
    urut: urut && SORT_OPTIONS.includes(urut) ? urut : "terpopuler",
    halaman: halaman ? Math.floor(halaman) : 1,
  };
}

/** Bangun query string dari filter; nilai bawaan tidak ditulis agar URL tetap pendek. */
export function catalogHref(filter: CatalogFilter, patch: Partial<CatalogFilter> = {}) {
  const f = { ...filter, ...patch };
  const sp = new URLSearchParams();
  if (f.q) sp.set("q", f.q);
  for (const k of f.kategori ?? []) sp.append("kategori", k);
  for (const j of f.jenis ?? []) sp.append("jenis", j);
  for (const j of f.jenjang ?? []) sp.append("jenjang", j);
  if (f.hargaMaks) sp.set("hargaMaks", String(f.hargaMaks));
  if (f.ratingMin) sp.set("ratingMin", String(f.ratingMin));
  if (f.urut && f.urut !== "terpopuler") sp.set("urut", f.urut);
  if (f.halaman && f.halaman > 1) sp.set("halaman", String(f.halaman));
  const qs = sp.toString();
  return qs ? `/program?${qs}` : "/program";
}

export function activeFilterCount(f: CatalogFilter) {
  return (
    (f.kategori?.length ?? 0) +
    (f.jenis?.length ?? 0) +
    (f.jenjang?.length ?? 0) +
    (f.hargaMaks ? 1 : 0) +
    (f.ratingMin ? 1 : 0)
  );
}
