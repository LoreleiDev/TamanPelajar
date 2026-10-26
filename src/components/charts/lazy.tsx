"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

// Recharts (±300 KB) hanya dimuat saat grafik dibutuhkan, tidak ikut bundle awal halaman.
// Pembungkus memesan tinggi yang sama dengan grafik agar tidak ada pergeseran layout (CLS).

function lazyChart<P extends object>(load: () => Promise<ComponentType<P>>, height: (props: P) => number) {
  const Inner = dynamic(load, { ssr: false });
  return function LazyChart(props: P) {
    return (
      <div style={{ minHeight: height(props) }}>
        <Inner {...props} />
      </div>
    );
  };
}

export const ScoreTrendChart = lazyChart(() => import("./charts").then((m) => m.ScoreTrendChart), () => 240);
export const TopicMasteryChart = lazyChart(
  () => import("./charts").then((m) => m.TopicMasteryChart),
  (p) => Math.max(160, p.data.length * 36 + 24),
);
export const StudyTimeChart = lazyChart(() => import("./charts").then((m) => m.StudyTimeChart), () => 220);
export const CompareChart = lazyChart(() => import("./charts").then((m) => m.CompareChart), () => 260);
export const TopicRadarChart = lazyChart(() => import("./charts").then((m) => m.TopicRadarChart), () => 300);
export const TopicCompareChart = lazyChart(
  () => import("./charts").then((m) => m.TopicCompareChart),
  (p) => Math.max(180, p.data.length * 56 + 48),
);
export const MonthlyChart = lazyChart(() => import("./charts").then((m) => m.MonthlyChart), () => 240);
