"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Sparkles, X } from "lucide-react";
import { parseQuery } from "@/lib/nlq";
import { filtersToSearchParams, DEFAULT_FILTERS } from "@/lib/filters";
import { useFilters } from "@/hooks/useFilters";

const EXAMPLES = ["Remote data entry jobs from Egypt", "Customer service Arabic $15/hour", "Remote jobs no experience", "Excel jobs worldwide posted today"];

/** Smart search: free text is parsed into structured filters client-side (spec §21). */
export function SearchBar() {
  const { filters } = useFilters();
  const router = useRouter();
  const [text, setText] = useState(filters.q);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => setText(filters.q), [filters.q]);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const run = (value: string) => {
    const parsed = parseQuery(value);
    const merged = { ...DEFAULT_FILTERS, ...parsed, posted: parsed.posted ?? filters.posted };
    const qs = filtersToSearchParams(merged).toString();
    router.push(qs ? `/?${qs}` : "/");
    setOpen(false);
  };
  const preview = text.trim() ? parseQuery(text) : null;
  const previewChips = preview ? [
    preview.egypt === "YES" && "🇪🇬 From Egypt",
    ...(preview.regions || []).map((r) => `📍 ${r}`),
    ...(preview.categories || []).map((c) => `📂 ${c}`),
    ...(preview.experience || []).map((e) => `🎯 ${e.replace("_", " ").toLowerCase()}`),
    ...(preview.skills || []).map((s) => `🧩 ${s}`),
    ...(preview.languages || []).map((l) => `🗣 ${l}`),
    preview.hourlyMin && `💰 $${preview.hourlyMin}+/h`,
    preview.posted && preview.posted !== "7d" && `🕐 ${preview.posted}`,
    preview.q && `🔍 "${preview.q}"`,
  ].filter(Boolean) as string[] : [];

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-2 rounded-2xl border px-3" style={{ borderColor: open ? "var(--accent)" : "var(--edge)", background: "var(--bg-solid)" }}>
        <Search size={17} style={{ color: "var(--ink-faint)" }} />
        <input
          value={text} onChange={(e) => { setText(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)}
          onKeyDown={(e) => { if (e.key === "Enter") run(text); if (e.key === "Escape") setOpen(false); }}
          placeholder="Search remote jobs — try “customer service Arabic $15/hour”"
          className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-[var(--ink-faint)]"
          aria-label="Search remote jobs"
        />
        {text && <button onClick={() => { setText(""); run(""); }} aria-label="Clear search" style={{ color: "var(--ink-faint)" }}><X size={16} /></button>}
      </div>
      {open && (
        <div className="card absolute left-0 right-0 top-12 z-50 p-3 animate-rise">
          {preview ? (
            <>
              <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold" style={{ color: "var(--accent-ink)" }}><Sparkles size={13} /> Understood as</div>
              <div className="flex flex-wrap gap-1.5">{previewChips.length ? previewChips.map((c) => <span key={c} className="chip" data-on="true">{c}</span>) : <span className="text-sm" style={{ color: "var(--ink-soft)" }}>Keyword search</span>}</div>
              <button className="btn btn-primary mt-3 w-full" onClick={() => run(text)}>Search</button>
            </>
          ) : (
            <>
              <div className="mb-2 text-xs font-semibold" style={{ color: "var(--ink-faint)" }}>Try one of these</div>
              <div className="flex flex-wrap gap-1.5">{EXAMPLES.map((e) => <button key={e} className="chip" onClick={() => { setText(e); run(e); }}>{e}</button>)}</div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
