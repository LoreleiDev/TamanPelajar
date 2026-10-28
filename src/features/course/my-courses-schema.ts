import { z } from "zod";

// Testimoni siswa setelah kelas selesai (revisi RMED). Batas panjang sama dengan form admin.
export const studentTestimonialSchema = z.object({
  courseId: z.string().min(1),
  opening: z.string().trim().min(5, "Kalimat pembuka minimal 5 karakter").max(160, "Kalimat pembuka maksimal 160 karakter"),
  body: z.string().trim().min(20, "Ceritakan minimal 20 karakter").max(1200, "Maksimal 1.200 karakter"),
});
export type StudentTestimonialInput = z.input<typeof studentTestimonialSchema>;
