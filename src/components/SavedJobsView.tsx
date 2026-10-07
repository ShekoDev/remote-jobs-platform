"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark } from "lucide-react";
import type { JobDTO } from "@/lib/api/dto";
import { JobCard, JobCardSkeleton } from "./JobCard";
import { JobDrawer } from "./JobDrawer";

type SavedSearch = { id: string; name: string; filters: Record<string, unknown> };

export function SavedJobsView() {
  const [jobs, setJobs] = useState<JobDTO[] | null>(null);
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [open, setOpen] = useState<JobDTO | null>(null);
  useEffect(() => {
    fetch("/api/saved").then((r) => r.json()).then((d) => setJobs(d.jobs)).catch(() => setJobs([]));
    fetch("/api/saved-searches").then((r) => r.json()).then((d) => setSearches(d.searches)).catch(() => {});
  }, []);
  const onSave = useCallback(async (job: JobDTO) => {
    await fetch("/api/saved", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ jobId: job.id }) });
    setJobs((j) => j && j.filter((x) => x.id !== job.id));
    setOpen(null);
  }, []);
  const toQs = (f: Record<string, unknown>) => Object.entries(f).filter(([, v]) => v !== undefined && v !== "" && !(Array.isArray(v) && !v.length)).map(([k, v]) => `${k}=${encodeURIComponent(Array.isArray(v) ? v.join(",") : String(v))}`).join("&");

  return (
    <div className="pt-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Saved jobs</h1>
      <p className="mt-1" style={{ color: "var(--ink-soft)" }}>Jobs you want to come back to. Closed ones stay here so you know what happened.</p>

      {searches.length > 0 && (
        <div className="mt-5">
          <div className="mb-2 text-sm font-bold">Saved searches</div>
          <div className="flex flex-wrap gap-2">
            {searches.map((s) => (
              <span key={s.id} className="chip gap-2">
                <Link href={`/?${toQs(s.filters)}`}>{s.name}</Link>
                <button aria-label={`Delete ${s.name}`} onClick={async () => { await fetch("/api/saved-searches", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: s.id }) }); setSearches((x) => x.filter((y) => y.id !== s.id)); }} style={{ color: "var(--ink-faint)" }}>×</button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 space-y-3">
        {jobs === null ? [0, 1, 2].map((i) => <JobCardSkeleton key={i} />) : jobs.length === 0 ? (
          <div className="card grid place-items-center gap-2 p-10 text-center">
            <Bookmark size={36} style={{ color: "var(--ink-faint)" }} />
            <div className="font-extrabold">Nothing saved yet</div>
            <p className="text-sm" style={{ color: "var(--ink-soft)" }}>Tap the bookmark on any job to keep it here.</p>
            <Link href="/" className="btn btn-primary mt-2">Browse remote jobs</Link>
          </div>
        ) : jobs.map((j) => <JobCard key={j.id} job={j} onOpen={setOpen} onSave={onSave} />)}
      </div>
      <JobDrawer job={open} onClose={() => setOpen(null)} onSave={onSave} />
    </div>
  );
}
