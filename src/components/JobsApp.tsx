"use client";
import { useCallback, useEffect, useState } from "react";
import { Bell, BookmarkPlus, SlidersHorizontal, SearchX, ServerCrash, RefreshCw } from "lucide-react";
import { useFilters } from "@/hooks/useFilters";
import { filtersToSearchParams, SORT_OPTIONS, countActiveFilters, type SortKey } from "@/lib/filters";
import type { JobDTO } from "@/lib/api/dto";
import { StatsBar, type Stats } from "./StatsBar";
import { QuickFilters } from "./QuickFilters";
import { FilterSidebar } from "./FilterSidebar";
import { JobCard, JobCardSkeleton } from "./JobCard";
import { JobDrawer } from "./JobDrawer";
import { SaveSearchDialog, AlertDialog } from "./Dialogs";
import { timeAgo } from "@/lib/format";

const SORT_LABELS: Record<SortKey, string> = { recommended: "Recommended", newest: "Newest", salary: "Highest salary", match: "Best match", company: "Company A–Z", relevant: "Most relevant" };

type Result = { jobs: JobDTO[]; total: number; page: number; pageSize: number };

export function JobsApp() {
  const { filters, set } = useFilters();
  const [data, setData] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [open, setOpen] = useState<JobDTO | null>(null);
  const [sheet, setSheet] = useState(false);
  const [dialog, setDialog] = useState<"save" | "alert" | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const qs = filtersToSearchParams(filters).toString();

  useEffect(() => {
    let alive = true;
    setLoading(true); setError(null);
    fetch(`/api/jobs?${qs}`)
      .then(async (r) => { if (!r.ok) throw new Error(`Search failed (HTTP ${r.status})`); return r.json(); })
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [qs]);

  useEffect(() => {
    fetch("/api/stats").then((r) => r.json()).then(setStats).catch(() => setStats({ live: 0, today: 0, egypt: 0, worldwide: 0, entry: 0, lastVerifiedAt: null }));
  }, [qs]);

  const notify = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2200); };

  const onSave = useCallback(async (job: JobDTO) => {
    const next = !job.saved;
    setData((d) => d && { ...d, jobs: d.jobs.map((j) => (j.id === job.id ? { ...j, saved: next } : j)) });
    setOpen((o) => (o && o.id === job.id ? { ...o, saved: next } : o));
    await fetch("/api/saved", { method: next ? "POST" : "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ jobId: job.id }) });
    notify(next ? "Saved to your list" : "Removed from saved jobs");
  }, []);

  const active = countActiveFilters(filters);
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const noData = stats && stats.live === 0;

  return (
    <div className="pt-6">
      <section className="mb-5">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">🌎 Remote jobs</h1>
        <p className="mt-1 text-base sm:text-lg" style={{ color: "var(--ink-soft)" }}>Find verified remote jobs you can actually apply for.</p>
        {stats?.lastVerifiedAt && <p className="mt-1 text-xs" style={{ color: "var(--ink-faint)" }}>Listings re-checked {timeAgo(stats.lastVerifiedAt)}</p>}
      </section>

      <StatsBar stats={stats} />
      <div className="mt-4"><QuickFilters /></div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[300px_1fr]">
        <div className="hidden lg:block lg:sticky lg:top-20 lg:self-start"><FilterSidebar /></div>

        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="text-lg font-extrabold">
              {loading && !data ? <span className="skeleton inline-block h-6 w-32 align-middle" /> : <>{data?.total.toLocaleString()} jobs found</>}
              {active > 0 && !loading && <span className="ml-2 text-sm font-semibold" style={{ color: "var(--ink-faint)" }}>with {active} filter{active > 1 ? "s" : ""}</span>}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: "var(--ink-soft)" }}>
                Sort
                <select className="input w-auto py-1.5" value={filters.sort} onChange={(e) => set({ sort: e.target.value as SortKey })}>{SORT_OPTIONS.map((s) => <option key={s} value={s}>{SORT_LABELS[s]}</option>)}</select>
              </label>
              <button className="btn btn-ghost hidden sm:inline-flex" onClick={() => setDialog("save")}><BookmarkPlus size={15} /> Save search</button>
              <button className="btn btn-ghost hidden sm:inline-flex" onClick={() => setDialog("alert")}><Bell size={15} /> Job alert</button>
            </div>
          </div>

          {error ? (
            <div className="card grid place-items-center gap-2 p-10 text-center">
              <ServerCrash size={36} style={{ color: "var(--bad)" }} />
              <div className="font-extrabold">Couldn't load jobs</div>
              <p className="max-w-sm text-sm" style={{ color: "var(--ink-soft)" }}>{error}. Check that the database is running and try again.</p>
              <button className="btn btn-primary mt-2" onClick={() => set({}, { replace: true })}><RefreshCw size={15} /> Retry</button>
            </div>
          ) : loading && !data ? (
            <div className="space-y-3">{[0, 1, 2, 3, 4].map((i) => <JobCardSkeleton key={i} />)}</div>
          ) : data && data.jobs.length === 0 ? (
            <div className="card grid place-items-center gap-2 p-10 text-center">
              <SearchX size={36} style={{ color: "var(--ink-faint)" }} />
              <div className="font-extrabold">{noData ? "No jobs ingested yet" : "No jobs match these filters"}</div>
              <p className="max-w-md text-sm" style={{ color: "var(--ink-soft)" }}>
                {noData ? "Run the worker (npm run ingest) to pull live listings from the configured sources. Nothing here is ever fabricated." : "Try widening the posted-date window, removing a skill, or setting Egypt eligibility to include Unknown."}
              </p>
              {!noData && <div className="mt-2 flex flex-wrap justify-center gap-2">
                {filters.posted !== "30d" && <button className="chip" onClick={() => set({ posted: "30d" })}>Show last 30 days</button>}
                {filters.egypt === "YES" && <button className="chip" onClick={() => set({ egypt: undefined })}>Include unknown eligibility</button>}
                {active > 0 && <button className="chip" onClick={() => set({ q: "", regions: [], categories: [], experience: [], employment: [], skills: [], education: [], languages: [], companyType: [], sources: [], verification: [], egypt: undefined, hourlyMin: undefined, salaryMin: undefined, salaryMax: undefined, arabicRequired: undefined, englishRequired: undefined, companyCountry: undefined, status: undefined })}>Clear all filters</button>}
              </div>}
            </div>
          ) : (
            <div className={`space-y-3 ${loading ? "opacity-60" : ""}`} aria-busy={loading}>
              {data?.jobs.map((j) => <JobCard key={j.id} job={j} onOpen={setOpen} onSave={onSave} />)}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button className="btn btn-ghost" disabled={filters.page <= 1} onClick={() => set({ page: filters.page - 1 })}>Previous</button>
                  <span className="text-sm font-semibold" style={{ color: "var(--ink-soft)" }}>Page {filters.page} of {totalPages}</span>
                  <button className="btn btn-ghost" disabled={filters.page >= totalPages} onClick={() => set({ page: filters.page + 1 })}>Next</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile: fixed filter & sort button + bottom sheet */}
      <div className="fixed inset-x-0 bottom-4 z-30 flex justify-center px-4 lg:hidden">
        <button onClick={() => setSheet(true)} className="btn btn-primary rounded-full px-6 py-3 shadow-glass"><SlidersHorizontal size={16} /> Filter & sort{active > 0 ? ` (${active})` : ""}</button>
      </div>
      {sheet && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSheet(false)} aria-label="Close filters" />
          <div className="absolute inset-x-0 bottom-0 max-h-[88vh] animate-rise rounded-t-3xl p-2" style={{ background: "var(--bg)" }}>
            <div className="mb-2 flex gap-2 px-2 pt-2">
              <select className="input" value={filters.sort} onChange={(e) => set({ sort: e.target.value as SortKey })}>{SORT_OPTIONS.map((s) => <option key={s} value={s}>Sort: {SORT_LABELS[s]}</option>)}</select>
              <button className="btn btn-ghost" onClick={() => { setSheet(false); setDialog("alert"); }}><Bell size={15} /></button>
              <button className="btn btn-ghost" onClick={() => { setSheet(false); setDialog("save"); }}><BookmarkPlus size={15} /></button>
            </div>
            <FilterSidebar onClose={() => setSheet(false)} />
          </div>
        </div>
      )}

      <JobDrawer job={open} onClose={() => setOpen(null)} onSave={onSave} />
      {dialog === "save" && <SaveSearchDialog filters={filters} onClose={() => setDialog(null)} onSaved={() => notify("Search saved")} />}
      {dialog === "alert" && <AlertDialog filters={filters} onClose={() => setDialog(null)} />}
      {toast && <div className="glass fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-full px-4 py-2 text-sm font-bold animate-rise lg:bottom-6">{toast}</div>}
    </div>
  );
}
