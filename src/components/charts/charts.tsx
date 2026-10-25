"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";

// Grafik dashboard (F.3) dengan Recharts. Warna dari token brand; pasangan dua seri
// (#3F7042 dan #A0C064) divalidasi dengan validator dataviz: CVD ΔE 26,3, normal ΔE 27,1.
// Kontras #A0C064 di bawah 3:1, jadi nilai selalu ditampilkan sebagai label dan tabel.

const C = {
  primary: "#3F7042",
  leaf: "#A0C064",
  grid: "#E6E7E6",
  axis: "#5B6563",
  ink: "#283331",
};

const axisProps = {
  tick: { fill: C.axis, fontSize: 13 },
  tickLine: false,
  axisLine: { stroke: C.grid },
} as const;

function TooltipBox({ active, payload, label, suffix }: TooltipContentProps & { suffix: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-soft">
      <p className="font-semibold">{label}</p>
      {payload.map((p) => (
        <p key={String(p.dataKey)} className="flex items-center gap-2 tabular-nums">
          <span aria-hidden="true" className="size-2.5 rounded-sm" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}</span>
          <span className="font-semibold">
            {String(p.value).replace(".", ",")}
            {suffix}
          </span>
        </p>
      ))}
    </div>
  );
}

/** Teks legenda memakai warna tinta, bukan warna seri (dataviz: identitas dibawa penanda). */
const legendText = (value: string) => <span style={{ color: C.ink }}>{value}</span>;

/** Perkembangan nilai (F.3.1, J.2.6): satu seri, persen dari nilai maksimum. */
export function ScoreTrendChart({ data }: { data: { label: string; percent: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 16, right: 16, bottom: 0, left: 0 }}>
        <CartesianGrid stroke={C.grid} vertical={false} />
        <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" />
        <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} {...axisProps} unit="%" width={56} />
        <Tooltip content={(p) => <TooltipBox {...p} suffix="%" />} cursor={{ stroke: C.axis, strokeDasharray: "3 3" }} />
        <Line
          type="monotone"
          dataKey="percent"
          name="Nilai"
          stroke={C.primary}
          strokeWidth={2}
          dot={{ r: 4, fill: C.primary, stroke: "#fff", strokeWidth: 2 }}
          activeDot={{ r: 6 }}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

/** Penguasaan topik (F.3.2, J.2.2): batang horizontal, topik terlemah di atas. */
export function TopicMasteryChart({ data }: { data: { topic: string; mastery: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 36 + 24)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 48, bottom: 0, left: 0 }} barCategoryGap={6}>
        <CartesianGrid stroke={C.grid} horizontal={false} />
        <XAxis type="number" domain={[0, 100]} ticks={[0, 50, 100]} {...axisProps} unit="%" />
        <YAxis type="category" dataKey="topic" {...axisProps} width={150} />
        <Tooltip content={(p) => <TooltipBox {...p} suffix="%" />} cursor={{ fill: "rgb(63 112 66 / 0.06)" }} />
        <Bar dataKey="mastery" name="Penguasaan" fill={C.primary} radius={[0, 4, 4, 0]} isAnimationActive={false}>
          <LabelList dataKey="mastery" position="right" formatter={(v) => `${v}%`} fill={C.ink} fontSize={13} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Waktu belajar per minggu (F.3.3), dalam menit. */
export function StudyTimeChart({ data }: { data: { label: string; minutes: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 20, right: 8, bottom: 0, left: -12 }} barCategoryGap="28%">
        <CartesianGrid stroke={C.grid} vertical={false} />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis {...axisProps} width={48} />
        <Tooltip content={(p) => <TooltipBox {...p} suffix=" menit" />} cursor={{ fill: "rgb(63 112 66 / 0.06)" }} />
        <Bar dataKey="minutes" name="Waktu belajar" fill={C.primary} radius={[4, 4, 0, 0]} isAnimationActive={false}>
          <LabelList dataKey="minutes" position="top" fill={C.ink} fontSize={12} formatter={(v) => (Number(v) > 0 ? v : "")} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Nilaimu dibanding rata-rata peserta (F.3.4, J.2.7): dua seri dengan legenda dan label. */
export function CompareChart({ data }: { data: { exam: string; mine: number; average: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 20, right: 8, bottom: 0, left: 0 }} barGap={2} barCategoryGap="30%">
        <CartesianGrid stroke={C.grid} vertical={false} />
        <XAxis dataKey="exam" {...axisProps} />
        <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} {...axisProps} unit="%" width={56} />
        <Tooltip content={(p) => <TooltipBox {...p} suffix="%" />} cursor={{ fill: "rgb(63 112 66 / 0.06)" }} />
        <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 13 }} formatter={legendText} />
        <Bar dataKey="mine" name="Nilai terbaikmu" fill={C.primary} radius={[4, 4, 0, 0]} isAnimationActive={false}>
          <LabelList dataKey="mine" position="top" fill={C.ink} fontSize={12} formatter={(v) => `${String(v).replace(".", ",")}%`} />
        </Bar>
        <Bar dataKey="average" name="Rata-rata peserta" fill={C.leaf} radius={[4, 4, 0, 0]} isAnimationActive={false}>
          <LabelList dataKey="average" position="top" fill={C.ink} fontSize={12} formatter={(v) => `${String(v).replace(".", ",")}%`} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Radar kemampuan per topik (I.6.7): satu seri, persen penguasaan. Butuh minimal 3 topik. */
export function TopicRadarChart({ data }: { data: { topic: string; mastery: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data} outerRadius="72%" margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
        <PolarGrid stroke={C.grid} />
        <PolarAngleAxis dataKey="topic" tick={{ fill: C.ink, fontSize: 12 }} />
        {/* Tanpa label skala: menabrak nama topik; nilai ada di tooltip dan tabel data. */}
        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
        <Tooltip content={(p) => <TooltipBox {...p} suffix="%" />} />
        <Radar
          dataKey="mastery"
          name="Penguasaan"
          stroke={C.primary}
          strokeWidth={2}
          fill={C.primary}
          fillOpacity={0.18}
          dot={{ r: 4, fill: C.primary, stroke: "#fff", strokeWidth: 2 }}
          isAnimationActive={false}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

/** Nilai per topik dibanding rata-rata peserta (I.6.8, J.2.7): batang horizontal dua seri. */
export function TopicCompareChart({ data }: { data: { topic: string; mine: number; average: number | null }[] }) {
  const label = (v: unknown) => (v === null || v === undefined ? "" : `${String(v).replace(".", ",")}%`);
  return (
    <ResponsiveContainer width="100%" height={Math.max(180, data.length * 56 + 48)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 48, bottom: 0, left: 0 }} barGap={2} barCategoryGap={10}>
        <CartesianGrid stroke={C.grid} horizontal={false} />
        <XAxis type="number" domain={[0, 100]} ticks={[0, 50, 100]} {...axisProps} unit="%" />
        <YAxis type="category" dataKey="topic" {...axisProps} width={150} />
        <Tooltip content={(p) => <TooltipBox {...p} suffix="%" />} cursor={{ fill: "rgb(63 112 66 / 0.06)" }} />
        <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 13 }} formatter={legendText} />
        <Bar dataKey="mine" name="Nilaimu" fill={C.primary} radius={[0, 4, 4, 0]} minPointSize={2} isAnimationActive={false}>
          <LabelList dataKey="mine" position="right" fill={C.ink} fontSize={12} formatter={label} />
        </Bar>
        <Bar dataKey="average" name="Rata-rata peserta" fill={C.leaf} radius={[0, 4, 4, 0]} isAnimationActive={false}>
          <LabelList dataKey="average" position="right" fill={C.ink} fontSize={12} formatter={label} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// Tanpa spasi: Recharts memecah teks bertspasi menjadi dua baris.
const shortRupiah = (v: number) =>
  v >= 1_000_000 ? `${String(Math.round(v / 100_000) / 10).replace(".", ",")}jt` : v >= 1000 ? `${Math.round(v / 1000)}rb` : String(v);

/**
 * Seri bulanan satu warna untuk dashboard admin: pendapatan (M.2.7) atau pengguna baru
 * (M.2.8). Satu seri, jadi tanpa legenda; judul kartu yang menamainya.
 */
export function MonthlyChart({ data, format, name }: { data: { label: string; value: number }[]; format: "rupiah" | "jumlah"; name: string }) {
  const fmt = (v: number) => (format === "rupiah" ? shortRupiah(v) : String(v));
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 22, right: 8, bottom: 0, left: 0 }} barCategoryGap="28%">
        <CartesianGrid stroke={C.grid} vertical={false} />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis {...axisProps} width={format === "rupiah" ? 52 : 40} tickFormatter={(v) => fmt(Number(v))} allowDecimals={false} />
        <Tooltip
          cursor={{ fill: "rgb(63 112 66 / 0.06)" }}
          content={({ active, payload, label }) =>
            active && payload?.length ? (
              <div className="rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-soft">
                <p className="font-semibold">{label}</p>
                <p className="tabular-nums">
                  <span className="text-muted-foreground">{name} </span>
                  <span className="font-semibold">
                    {format === "rupiah"
                      ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(payload[0].value))
                      : String(payload[0].value)}
                  </span>
                </p>
              </div>
            ) : null
          }
        />
        <Bar dataKey="value" name={name} fill={C.primary} radius={[4, 4, 0, 0]} minPointSize={2} isAnimationActive={false}>
          <LabelList dataKey="value" position="top" fill={C.ink} fontSize={12} formatter={(v) => (Number(v) > 0 ? fmt(Number(v)) : "")} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
