"use client";
import { useFilters } from "@/hooks/useFilters";
import type { Filters } from "@/lib/filters";

const QUICK: { label: string; patch: Partial<Filters>; test: (f: Filters) => boolean }[] = [
  { label: "🔥 Posted today", patch: { posted: "today" }, test: (f) => f.posted === "today" },
  { label: "🇪🇬 From Egypt", patch: { egypt: "YES" }, test: (f) => f.egypt === "YES" },
  { label: "🌍 Worldwide", patch: { regions: ["WORLDWIDE"] }, test: (f) => f.regions.length === 1 && f.regions[0] === "WORLDWIDE" },
  { label: "💰 High salary", patch: { hourlyMin: 30 }, test: (f) => (f.hourlyMin ?? 0) >= 30 },
  { label: "🎓 No experience", patch: { experience: ["NO_EXPERIENCE", "ENTRY"] }, test: (f) => f.experience.includes("NO_EXPERIENCE") },
  { label: "💻 Data jobs", patch: { categories: ["data"] }, test: (f) => f.categories.length === 1 && f.categories[0] === "data" },
  { label: "📞 Customer service", patch: { categories: ["customer_service"] }, test: (f) => f.categories.length === 1 && f.categories[0] === "customer_service" },
  { label: "🤖 AI jobs", patch: { categories: ["ai"] }, test: (f) => f.categories.length === 1 && f.categories[0] === "ai" },
  { label: "📊 Excel jobs", patch: { skills: ["Excel"] }, test: (f) => f.skills.includes("Excel") },
  { label: "⭐ Best matches", patch: { sort: "match" }, test: (f) => f.sort === "match" },
];

export function QuickFilters() {
  const { filters, set } = useFilters();
  return (
    <div className="scrollbar-thin -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
      {QUICK.map((q) => {
        const on = q.test(filters);
        return (
          <button key={q.label} className="chip" data-on={on} onClick={() => {
            if (!on) return set(q.patch);
            // toggle off: reset the keys this quick filter touched
            const reset: Partial<Filters> = {};
            for (const k of Object.keys(q.patch) as (keyof Filters)[]) (reset as Record<string, unknown>)[k] = Array.isArray(q.patch[k]) ? [] : k === "posted" ? "7d" : k === "sort" ? "recommended" : undefined;
            set(reset);
          }}>{q.label}</button>
        );
      })}
    </div>
  );
}
