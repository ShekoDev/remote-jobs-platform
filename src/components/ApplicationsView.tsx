"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardList, ExternalLink, Trash2 } from "lucide-react";
import { TRACKER_LABELS, salaryLabel } from "@/lib/format";

type Row = { id: string; jobId: string; status: string; appliedAt: string | null; notes: string | null; job: { title: string; company: string; applyUrl: string; applicationStatus: string; salaryMin: number | null; salaryMax: number | null; salaryCurrency: string | null; salaryPeriod: string | null } };
const STATUSES = Object.keys(TRACKER_LABELS);

export function ApplicationsView() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [filter, setFilter] = useState<string>("ALL");
  useEffect(() => { fetch("/api/applications").then((r) => r.json()).then((d) => setRows(d.applications)).catch(() => setRows([])); }, []);

  const update = async (jobId: string, patch: { status?: string; notes?: string }) => {
    setRows((r) => r && r.map((x) => (x.jobId === jobId ? { ...x, ...patch, appliedAt: patch.status === "APPLIED" && !x.appliedAt ? new Date().toISOString() : x.appliedAt } : x)));
    await fetch("/api/applications", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jobId, ...patch }) });
  };
  const remove = async (jobId: string) => {
    setRows((r) => r && r.filter((x) => x.jobId !== jobId));
    await fetch("/api/applications", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ jobId }) });
  };
  const visible = rows?.filter((r) => filter === "ALL" || r.status === filter) ?? [];
  const counts = Object.fromEntries(STATUSES.map((s) => [s, rows?.filter((r) => r.status === s).length ?? 0]));

  return (
    <div className="pt-6">
      <h1 className="text-3xl font-extrabold tracking-tight">My applications</h1>
      <p className="mt-1" style={{ color: "var(--ink-soft)" }}>Track every job from saved to offer.</p>

      <div className="scrollbar-thin mt-4 flex gap-2 overflow-x-auto pb-1">
        <button className="chip" data-on={filter === "ALL"} onClick={() => setFilter("ALL")}>All {rows?.length ?? 0}</button>
        {STATUSES.map((s) => <button key={s} className="chip" data-on={filter === s} onClick={() => setFilter(s)}>{TRACKER_LABELS[s]} {counts[s]}</button>)}
      </div>

      <div className="card mt-4 overflow-hidden">
        {rows === null ? <div className="space-y-2 p-4">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-12" />)}</div> : visible.length === 0 ? (
          <div className="grid place-items-center gap-2 p-10 text-center">
            <ClipboardList size={36} style={{ color: "var(--ink-faint)" }} />
            <div className="font-extrabold">{rows.length ? "No applications with this status" : "No applications tracked yet"}</div>
            <p className="text-sm" style={{ color: "var(--ink-soft)" }}>Saving a job adds it here automatically. Change its status as you go.</p>
            {!rows.length && <Link href="/" className="btn btn-primary mt-2">Find jobs to apply for</Link>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead><tr className="text-left text-xs" style={{ color: "var(--ink-faint)" }}>{["Job", "Company", "Date applied", "Salary", "Status", "Notes", ""].map((h) => <th key={h} className="px-4 py-3 font-bold">{h}</th>)}</tr></thead>
              <tbody>
                {visible.map((r) => (
                  <tr key={r.id} className="border-t" style={{ borderColor: "var(--edge)" }}>
                    <td className="px-4 py-3 font-bold">
                      <a href={r.job.applyUrl} target="_blank" rel="noopener noreferrer nofollow" className="flex items-center gap-1 hover:underline">{r.job.title} <ExternalLink size={13} /></a>
                      {r.job.applicationStatus === "CLOSED" && <span className="tag mt-1" style={{ background: "var(--bad-soft)", color: "var(--bad)" }}>Listing closed</span>}
                    </td>
                    <td className="px-4 py-3">{r.job.company}</td>
                    <td className="px-4 py-3 tabular-nums">{r.appliedAt ? new Date(r.appliedAt).toLocaleDateString() : "—"}</td>
                    <td className="px-4 py-3">{salaryLabel(r.job)}</td>
                    <td className="px-4 py-3"><select className="input py-1" value={r.status} onChange={(e) => update(r.jobId, { status: e.target.value })}>{STATUSES.map((s) => <option key={s} value={s}>{TRACKER_LABELS[s]}</option>)}</select></td>
                    <td className="px-4 py-3"><input className="input py-1" placeholder="Add a note" defaultValue={r.notes ?? ""} onBlur={(e) => e.target.value !== (r.notes ?? "") && update(r.jobId, { notes: e.target.value })} /></td>
                    <td className="px-2 py-3"><button aria-label="Remove" onClick={() => remove(r.jobId)} className="rounded-lg p-1.5 hover:bg-[var(--bad-soft)]" style={{ color: "var(--ink-faint)" }}><Trash2 size={15} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
