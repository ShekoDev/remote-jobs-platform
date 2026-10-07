"use client";
import { Bookmark, BookmarkCheck, ExternalLink, ShieldCheck, ShieldAlert, Layers } from "lucide-react";
import type { JobDTO } from "@/lib/api/dto";
import { salaryLabel, postedLabel, timeAgo, EXPERIENCE_LABELS } from "@/lib/format";
import { REGION_BY_CODE } from "@/lib/taxonomy";

export function EgyptTag({ v }: { v: string }) {
  const map = { YES: ["🇪🇬 Egypt eligible", "var(--ok-soft)", "var(--ok)"], NO: ["Not open to Egypt", "var(--bad-soft)", "var(--bad)"], UNKNOWN: ["Eligibility unknown", "var(--warn-soft)", "var(--warn)"] } as Record<string, string[]>;
  const [label, bg, fg] = map[v] ?? map.UNKNOWN;
  return <span className="tag" style={{ background: bg, color: fg }}>{label}</span>;
}

export function RegionTags({ regions }: { regions: string[] }) {
  if (!regions.length) return null;
  return <>{regions.slice(0, 3).map((r) => <span key={r} className="tag" style={{ background: "var(--accent-soft)", color: "var(--accent-ink)" }}>{REGION_BY_CODE[r]?.flag} {REGION_BY_CODE[r]?.label ?? r}</span>)}</>;
}

export function JobCard({ job, onOpen, onSave }: { job: JobDTO; onOpen: (j: JobDTO) => void; onSave: (j: JobDTO) => void }) {
  const isToday = Date.now() - new Date(job.postedAt).getTime() < 86_400_000;
  return (
    <article className="card group relative p-4 transition hover:border-[var(--accent)] sm:p-5">
      <div className="flex gap-3.5">
        <button onClick={() => onOpen(job)} aria-label={`Open ${job.title}`} className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl text-lg font-extrabold" style={{ background: "var(--accent-soft)", color: "var(--accent-ink)" }}>
          {job.companyLogo ? <img src={job.companyLogo} alt="" className="h-full w-full object-contain" loading="lazy" /> : job.company.charAt(0).toUpperCase()}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <button onClick={() => onOpen(job)} className="block truncate text-left text-base font-extrabold leading-tight hover:underline sm:text-[17px]">{job.title}</button>
              <div className="mt-0.5 truncate text-sm font-semibold" style={{ color: "var(--ink-soft)" }}>{job.company}</div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <span className="tag text-sm" style={{ background: job.matchScore >= 80 ? "var(--ok-soft)" : "var(--accent-soft)", color: job.matchScore >= 80 ? "var(--ok)" : "var(--accent-ink)" }}>⭐ {job.matchScore}%</span>
              <button onClick={() => onSave(job)} aria-label={job.saved ? "Unsave job" : "Save job"} className="rounded-lg p-1.5 transition hover:bg-[var(--accent-soft)]" style={{ color: job.saved ? "var(--accent)" : "var(--ink-faint)" }}>{job.saved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}</button>
            </div>
          </div>

          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <span className="tag" style={{ background: "var(--ok-soft)", color: "var(--ok)" }}>🟢 Fully remote</span>
            <EgyptTag v={job.egyptEligible} />
            <span className="tag" style={{ background: job.salaryHourlyUsd ? "var(--hot-soft)" : "var(--edge)", color: job.salaryHourlyUsd ? "var(--hot)" : "var(--ink-soft)" }}>💰 {salaryLabel(job)}</span>
            {job.experience !== "UNKNOWN" && <span className="tag" style={{ background: "var(--edge)", color: "var(--ink-soft)" }}>🎯 {EXPERIENCE_LABELS[job.experience]}</span>}
            <span className="tag" style={{ background: isToday ? "var(--hot-soft)" : "var(--edge)", color: isToday ? "var(--hot)" : "var(--ink-soft)" }}>🕐 {postedLabel(job.postedAt)}</span>
            <span className="tag" style={{ background: job.verification === "VERIFIED" ? "var(--ok-soft)" : "var(--warn-soft)", color: job.verification === "VERIFIED" ? "var(--ok)" : "var(--warn)" }}>
              {job.verification === "VERIFIED" ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />} {job.trustScore}/100 · {job.trustLabel}
            </span>
            {job.sourceCount > 1 && <span className="tag" style={{ background: "var(--edge)", color: "var(--ink-soft)" }}><Layers size={12} /> Found on {job.sourceCount} sources</span>}
          </div>

          {job.skills.length > 0 && <div className="mt-2.5 truncate text-xs font-semibold" style={{ color: "var(--ink-soft)" }}>{job.skills.slice(0, 6).join(" • ")}</div>}

          {job.matchReasons.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-xs" style={{ color: "var(--accent-ink)" }}>{job.matchReasons.map((r) => <span key={r}>✓ {r}</span>)}</div>
          )}

          <div className="mt-3.5 flex flex-wrap items-center gap-2">
            <a href={job.applyUrl} target="_blank" rel="noopener noreferrer nofollow" className="btn btn-primary">Apply now <ExternalLink size={15} /></a>
            <button onClick={() => onOpen(job)} className="btn btn-ghost">Details</button>
            <span className="ml-auto text-xs" style={{ color: "var(--ink-faint)" }}>{job.lastVerifiedAt ? `Verified ${timeAgo(job.lastVerifiedAt)}` : "Awaiting verification"}{job.applyUrlIsOfficial ? " · Official company application" : ""}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

export function JobCardSkeleton() {
  return (
    <div className="card p-5">
      <div className="flex gap-3.5">
        <div className="skeleton h-12 w-12 rounded-xl" />
        <div className="flex-1">
          <div className="skeleton h-5 w-2/3" /><div className="skeleton mt-2 h-4 w-1/3" />
          <div className="mt-3 flex gap-1.5">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-6 w-24" />)}</div>
          <div className="skeleton mt-3 h-4 w-1/2" /><div className="mt-4 flex gap-2"><div className="skeleton h-10 w-28" /><div className="skeleton h-10 w-20" /></div>
        </div>
      </div>
    </div>
  );
}
