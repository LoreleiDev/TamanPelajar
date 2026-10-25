import { z } from "zod";

// Aturan upload file admin ke Cloudinary (CLAUDE.md "Penyimpanan file"): folder per domain,
// tipe dan ukuran divalidasi di server sebelum signature dibuat.

export const MEDIA_FOLDERS = ["produk", "kelas", "soal", "artikel", "banner", "sertifikat"] as const;
export type MediaFolder = (typeof MEDIA_FOLDERS)[number];

export const IMAGE_FORMATS = ["jpg", "jpeg", "png", "webp", "gif"] as const;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_PDF_BYTES = 20 * 1024 * 1024;
/** Template tugas praktik sertifikat: dokumen atau arsip, maks. 20 MB. */
export const DOCUMENT_FORMATS = ["pdf", "docx", "zip"] as const;

export const signatureRequestSchema = z.object({
  folder: z.enum(MEDIA_FOLDERS),
  kind: z.enum(["image", "pdf", "dokumen"]),
  format: z.string().trim().toLowerCase().max(10),
  bytes: z.number().int().positive(),
});
export type SignatureRequest = z.infer<typeof signatureRequestSchema>;

/** Pesan error bila file tidak boleh diunggah, atau null bila boleh. */
export function uploadRejection(req: SignatureRequest): string | null {
  if (req.kind === "image") {
    if (!(IMAGE_FORMATS as readonly string[]).includes(req.format)) return "Gambar harus JPG, PNG, WEBP, atau GIF.";
    if (req.bytes > MAX_IMAGE_BYTES) return "Ukuran gambar maksimal 5 MB.";
    return null;
  }
  if (req.kind === "dokumen") {
    if (!(DOCUMENT_FORMATS as readonly string[]).includes(req.format)) return "Template harus PDF, DOCX, atau ZIP.";
    if (req.bytes > MAX_PDF_BYTES) return "Ukuran file maksimal 20 MB.";
    return null;
  }
  if (req.format !== "pdf") return "File materi harus PDF.";
  if (req.bytes > MAX_PDF_BYTES) return "Ukuran PDF maksimal 20 MB.";
  return null;
}

/** PDF materi, template tugas, dan sertifikat memakai delivery authenticated; gambar publik memakai upload. */
export const deliveryFor = (req: Pick<SignatureRequest, "kind">) => (req.kind === "image" ? "upload" : "authenticated");

export const uploadResultSchema = z.object({
  public_id: z.string().min(1).max(255),
  version: z.number().int(),
  signature: z.string().min(1),
  resource_type: z.enum(["image", "raw", "video"]),
  format: z.string().max(10).default(""),
  bytes: z.number().int().nonnegative(),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
  type: z.enum(["upload", "authenticated"]),
  folder: z.enum(MEDIA_FOLDERS),
});
