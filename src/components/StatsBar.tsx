"use client";
import { useFilters } from "@/hooks/useFilters";

export type Stats = { live: number; today: number; egypt: number; worldwide: number; entry: number; lastVerifiedAt: string | null };

export function StatsBar({ stats }: { stats: Stats | null }) {
  const { set } = useFilters();
  const items = [
    { label: "Live jobs", value: stats?.live, onClick: () => set({ posted: "30d" }) },
    { label: "Posted today", value: stats?.today, onClick: () => set({ posted: "today" }) },
    { label: "Egypt eligible", value: stats?.egypt, onClick: () => set({ egypt: "YES" }) },
    { label: "Worldwide", value: stats?.worldwide, onClick: () => set({ regions: ["WORLDWIDE"] }) },
    { label: "Entry level", value: stats?.entry, onClick: () => set({ experience: ["ENTRY", "NO_EXPERIENCE"] }) },
  ];
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 lg:gap-3">
      {items.map((it) => (
        <button key={it.label} onClick={it.onClick} className="card px-4 py-3 text-left transition hover:border-[var(--accent)]">
          {it.value === undefined ? <div className="skeleton mb-1 h-7 w-20" /> : <div className="text-2xl font-extrabold tabular-nums tracking-tight">{it.value.toLocaleString()}</div>}
          <div className="text-xs font-semibold" style={{ color: "var(--ink-soft)" }}>{it.label}</div>
        </button>
      ))}
    </div>
  );
}
