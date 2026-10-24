import type { ReactNode } from "react";

/**
 * Bingkai grafik: judul, keterangan, grafik, dan tabel data yang bisa dibuka (tampilan
 * tabel untuk pembaca layar dan saat warna sulit dibedakan).
 */
export function ChartFigure({
  title,
  description,
  columns,
  rows,
  children,
  empty,
}: {
  title: string;
  description?: string;
  columns: string[];
  rows: (string | number)[][];
  children: ReactNode;
  empty?: ReactNode;
}) {
  return (
    <figure className="flex min-w-0 flex-col gap-3">
      <figcaption className="flex flex-col gap-0.5">
        <span className="font-bold">{title}</span>
        {description && <span className="text-sm text-muted-foreground">{description}</span>}
      </figcaption>
      {rows.length === 0 ? (
        (empty ?? <p className="rounded-xl bg-secondary px-4 py-8 text-center text-sm text-muted-foreground">Belum ada data.</p>)
      ) : (
        <>
          <div aria-hidden="true">{children}</div>
          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground hover:text-primary">Lihat tabel data</summary>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-left tabular-nums">
                <caption className="sr-only">{title}</caption>
                <thead>
                  <tr>
                    {columns.map((c) => (
                      <th key={c} scope="col" className="py-1 pr-4 font-semibold">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i}>
                      {r.map((cell, j) =>
                        j === 0 ? (
                          <th key={j} scope="row" className="py-1 pr-4 font-normal">
                            {cell}
                          </th>
                        ) : (
                          <td key={j} className="py-1 pr-4">
                            {cell}
                          </td>
                        ),
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </figure>
  );
}
