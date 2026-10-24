import { Stars } from "@/components/shared/rating";
import type { ProductDetail } from "@/features/catalog/types";
import { formatTanggal } from "@/lib/format";

const rating = new Intl.NumberFormat("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** Rating dan ulasan (D.3.8). Ulasan terbaru lebih dulu; avatar berupa inisial. */
export function Reviews({ product }: { product: ProductDetail }) {
  if (product.ratingAvg === null || product.ratingCount === 0) {
    return (
      <p className="rounded-xl bg-secondary px-5 py-6">
        Belum ada ulasan untuk paket ini. Ulasan bisa ditulis oleh pembeli setelah menyelesaikan minimal satu materi
        atau tryout.
      </p>
    );
  }

  const latest = [...product.reviews].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <div className="grid gap-8 md:grid-cols-[12rem_1fr]">
      <div className="flex flex-col gap-1">
        <p className="text-display leading-none text-primary tabular-nums">{rating.format(product.ratingAvg)}</p>
        <Stars value={Math.round(product.ratingAvg)} />
        <p className="text-sm text-muted-foreground tabular-nums">dari {product.ratingCount} ulasan</p>
      </div>
      {latest.length === 0 ? (
        <p className="text-muted-foreground">Ulasan tertulis belum ditampilkan.</p>
      ) : (
        <ul className="flex flex-col gap-6">
          {latest.map((r) => (
            <li key={r.id} className="flex gap-4">
              <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-accent font-bold text-primary">
                {r.userName.charAt(0)}
              </span>
              <div className="flex flex-col gap-1">
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-bold">{r.userName}</span>
                  <Stars value={r.rating} />
                  <time dateTime={r.createdAt.toISOString()} className="text-sm text-muted-foreground">
                    {formatTanggal(r.createdAt)}
                  </time>
                </p>
                <p className="leading-relaxed">{r.body}</p>
              </div>
            </li>
          ))}
          {latest.length < product.ratingCount && (
            <li className="text-sm text-muted-foreground tabular-nums">
              Menampilkan {latest.length} ulasan tertulis terbaru dari {product.ratingCount} penilaian.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
