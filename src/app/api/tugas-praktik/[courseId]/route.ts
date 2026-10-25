import { NextResponse } from "next/server";

import { syncCertificateTrack } from "@/features/certificate/service";
import { cloudinaryConfigured, signedDownloadUrl } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/rbac";

// Unduh template tugas praktik sertifikat (revisi RMED): hanya admin atau peserta batch kelas
// itu. File memakai delivery authenticated; browser dialihkan ke signed URL 5 menit.
export async function GET(request: Request, ctx: RouteContext<"/api/tugas-praktik/[courseId]">) {
  const { courseId } = await ctx.params;
  const user = await currentUser();
  if (!user) {
    const back = new URL(request.headers.get("referer") ?? "/", request.url);
    return NextResponse.redirect(new URL(`/masuk?callbackUrl=${encodeURIComponent(back.pathname)}`, request.url));
  }
  const certificate = await prisma.certificate.findUnique({
    where: { courseId },
    select: { practicalTemplate: { select: { publicId: true, format: true, resourceType: true } } },
  });
  if (!certificate?.practicalTemplate) return NextResponse.json({ error: "Template tugas tidak ditemukan." }, { status: 404 });
  if (user.role !== "ADMIN") {
    const track = await syncCertificateTrack(user.id, courseId);
    if (!track?.participant) return NextResponse.json({ error: "Template hanya untuk peserta batch kelas ini." }, { status: 403 });
  }
  if (!cloudinaryConfigured()) {
    return NextResponse.json({ error: "Penyimpanan file belum dikonfigurasi. Hubungi admin." }, { status: 503 });
  }
  return NextResponse.redirect(signedDownloadUrl(certificate.practicalTemplate));
}
