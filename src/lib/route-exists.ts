import { prisma } from "@/lib/prisma";

// Cek keberadaan slug untuk rute dinamis publik, dipanggil dari proxy.ts sebelum halaman
// dirender (Q.2.5, P.2.7). Halaman memakai streaming, dan setelah streaming dimulai status
// HTTP terkunci di 200; tanpa cek ini slug yang tidak ada menjadi "soft 404". Hanya
// hasil positif yang di-cache sebentar, jadi konten baru dari admin langsung bisa dibuka.

const TTL_MS = 60_000;
const known = new Map<string, number>();

const published = { status: "TERBIT", deletedAt: null } as const;

type Matcher = { pattern: RegExp; exists: (m: RegExpMatchArray) => Promise<boolean> };

const matchers: Matcher[] = [
  { pattern: /^\/paket\/([^/]+)$/, exists: async ([, slug]) => Boolean(await prisma.product.findFirst({ where: { slug, ...published }, select: { id: true } })) },
  { pattern: /^\/video\/([^/]+)$/, exists: async ([, slug]) => Boolean(await prisma.video.findFirst({ where: { slug, status: "TERBIT" }, select: { id: true } })) },
  { pattern: /^\/kelas\/([^/]+)$/, exists: async ([, slug]) => Boolean(await prisma.course.findFirst({ where: { slug, ...published }, select: { id: true } })) },
  {
    pattern: /^\/kelas\/([^/]+)\/([^/]+)$/,
    exists: async ([, course, lesson]) =>
      Boolean(await prisma.lesson.findFirst({ where: { slug: lesson, section: { course: { slug: course, ...published } } }, select: { id: true } })),
  },
  {
    // /tryout/hasil dan /tryout/pembahasan punya segmen kedua, jadi tidak cocok di sini.
    pattern: /^\/tryout\/([^/]+)$/,
    exists: async ([, slug]) => Boolean(await prisma.exam.findFirst({ where: { slug, ...published }, select: { id: true } })),
  },
  {
    pattern: /^\/informasi\/([^/]+)$/,
    exists: async ([, slug]) => Boolean(await prisma.article.findFirst({ where: { slug, status: "TERBIT", publishedAt: { not: null } }, select: { id: true } })),
  },
  {
    pattern: /^\/sertifikat\/([^/]+)$/,
    exists: async ([, number]) => Boolean(await prisma.userCertificate.findUnique({ where: { number }, select: { id: true } })),
  },
];

/** true bila path bukan rute dinamis yang dicek, atau slug-nya ada. */
export async function dynamicRouteExists(pathname: string): Promise<boolean> {
  for (const m of matchers) {
    const match = pathname.match(m.pattern);
    if (!match) continue;
    const decoded = match.map((part) => {
      try {
        return decodeURIComponent(part);
      } catch {
        return part;
      }
    }) as RegExpMatchArray;
    const now = Date.now();
    if ((known.get(pathname) ?? 0) > now) return true;
    try {
      const ok = await m.exists(decoded);
      if (ok) known.set(pathname, now + TTL_MS);
      return ok;
    } catch (e) {
      // Database bermasalah: biarkan halaman yang menangani agar tidak salah memberi 404.
      console.error("Cek rute gagal", pathname, e);
      return true;
    }
  }
  return true;
}
