import { NextResponse } from "next/server";

import { canAccessLesson } from "@/lib/access";
import { cloudinaryConfigured, signedDownloadUrl } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/rbac";

// Unduh PDF materi (G.4.4, C.1.4): cek akses materi pemiliknya, lalu alihkan ke signed URL
// Cloudinary yang kedaluwarsa dalam 5 menit. URL mentah tidak pernah ada di halaman.
export async function GET(request: Request, ctx: RouteContext<"/api/materi/[id]">) {
  const { id } = await ctx.params;
  const user = await currentUser();
  if (!user) {
    const back = new URL(request.headers.get("referer") ?? "/", request.url);
    return NextResponse.redirect(new URL(`/masuk?callbackUrl=${encodeURIComponent(back.pathname)}`, request.url));
  }

  const material = await prisma.material.findUnique({
    where: { id },
    select: { lessonId: true, media: { select: { publicId: true, format: true, resourceType: true } } },
  });
  if (!material) return NextResponse.json({ error: "Lampiran tidak ditemukan." }, { status: 404 });

  const { access } = await canAccessLesson(user, material.lessonId);
  if (access !== "terbuka") {
    return NextResponse.json({ error: "Lampiran ini belum terbuka untuk akunmu." }, { status: 403 });
  }
  if (!cloudinaryConfigured()) {
    return NextResponse.json({ error: "Penyimpanan file belum dikonfigurasi. Hubungi admin." }, { status: 503 });
  }
  return NextResponse.redirect(signedDownloadUrl(material.media));
}
