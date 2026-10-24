// Label dan pilihan katalog. Tanpa dependensi data, aman diimpor client component.

import type { EducationLevel, ProgramType, SortOption } from "./types";

export const PROGRAM_TYPES: ProgramType[] = ["BUNDEL", "KELAS", "TRYOUT"];
export const EDUCATION_LEVELS: EducationLevel[] = ["SMA", "S1", "UMUM"];
export const SORT_OPTIONS: SortOption[] = ["terpopuler", "terbaru", "termurah", "termahal"];
export const PRICE_STEPS = [100000, 200000, 300000, 500000];
export const RATING_STEPS = [4, 4.5];

export const programTypeLabels: Record<ProgramType, string> = {
  BUNDEL: "Paket lengkap",
  KELAS: "Kelas",
  TRYOUT: "Tryout",
};

export const educationLevelLabels: Record<EducationLevel, string> = {
  SMP: "SMP",
  SMA: "SMA/MA",
  SMK: "SMK",
  D3: "D3",
  S1: "S1",
  S2: "S2",
  UMUM: "Umum",
};

export const sortLabels: Record<SortOption, string> = {
  terpopuler: "Terpopuler",
  terbaru: "Terbaru",
  termurah: "Harga termurah",
  termahal: "Harga tertinggi",
};
