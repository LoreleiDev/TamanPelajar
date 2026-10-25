import { NextResponse } from "next/server";

import { deliveryFor, signatureRequestSchema, uploadRejection } from "@/features/admin/media";
import { cloudinaryConfigured, signUploadParams } from "@/lib/cloudinary";
import { currentUser } from "@/lib/rbac";

// Signature upload Cloudinary untuk admin (CLAUDE.md "Penyimpanan file"). Tipe dan ukuran
// diperiksa lebih dulu; API secret tetap di server, browser hanya menerima signature.
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Hanya admin yang boleh mengunggah file." }, { status: 403 });
  if (!cloudinaryConfigured()) {
    return NextResponse.json({ error: "Penyimpanan file belum dikonfigurasi. Isi variabel CLOUDINARY_* di server." }, { status: 503 });
  }
  const parsed = signatureRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Permintaan upload tidak valid." }, { status: 400 });
  const rejection = uploadRejection(parsed.data);
  if (rejection) return NextResponse.json({ error: rejection }, { status: 400 });

  const type = deliveryFor(parsed.data);
  const folder = `${process.env.CLOUDINARY_UPLOAD_FOLDER || "tamanpelajar"}/${parsed.data.folder}`;
  const signed = signUploadParams({ folder, ...(type === "authenticated" && { type }) });
  return NextResponse.json({
    ...signed,
    folder,
    type,
    resourceType: parsed.data.kind === "pdf" ? "raw" : "image",
  });
}
