// Tipe katalog mengikuti rancangan model Prisma (docs/ARSITEKTUR.md §2.3, §2.6).
// Di Tahap 2 query di queries.ts diganti Prisma tanpa mengubah tipe ini.

export type ProgramType = "KELAS" | "TRYOUT" | "BUNDEL";
export type EducationLevel = "SMP" | "SMA" | "SMK" | "D3" | "S1" | "S2" | "UMUM";

export interface Category {
  id: string;
  slug: string;
  name: string;
  /** Singkatan untuk sampul tipografis kartu paket, mis. "SKD". */
  shortName: string;
  description: string;
  /** Siapa yang biasanya mengikuti, satu frasa. */
  audience: string;
  order: number;
}

export interface ProductSummary {
  id: string;
  slug: string;
  name: string;
  category: Pick<Category, "slug" | "name" | "shortName">;
  programType: ProgramType;
  educationLevel: EducationLevel;
  summary: string;
  /** URL Cloudinary; null berarti memakai sampul tipografis. */
  thumbnailUrl: string | null;
  price: number;
  promoPrice: number | null;
  activeDays: number;
  videoCount: number;
  materialCount: number;
  tryoutCount: number;
  ratingAvg: number | null;
  ratingCount: number;
  salesCount: number;
  createdAt: Date;
}

export interface SyllabusSection {
  title: string;
  isFree: boolean;
  lessons: string[];
}

export interface IncludedCourse {
  slug: string;
  title: string;
  lessonCount: number;
  videoCount: number;
  sections: SyllabusSection[];
}

export interface IncludedExam {
  slug: string;
  title: string;
  questionCount: number;
  durationMin: number;
  sectionNames: string[];
}

export interface Review {
  id: string;
  userName: string;
  rating: number;
  body: string;
  createdAt: Date;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface ProductDetail extends ProductSummary {
  description: string[];
  features: string[];
  courses: IncludedCourse[];
  exams: IncludedExam[];
  faq: FaqItem[];
  reviews: Review[];
}

export interface Testimonial {
  id: string;
  name: string;
  program: string;
  opening: string;
  body: string[];
}

export interface PlatformStats {
  students: number;
  courses: number;
  questions: number;
  finishedTryouts: number;
}

export type SortOption = "terbaru" | "terpopuler" | "termurah" | "termahal";

export interface CatalogFilter {
  q?: string;
  kategori?: string[];
  jenis?: ProgramType[];
  jenjang?: EducationLevel[];
  hargaMaks?: number;
  ratingMin?: number;
  urut?: SortOption;
  halaman?: number;
}

export interface CatalogPage {
  items: ProductSummary[];
  total: number;
  page: number;
  pageCount: number;
  pageSize: number;
}
