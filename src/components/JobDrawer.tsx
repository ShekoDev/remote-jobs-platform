"use client";
import { useEffect, useState } from "react";
import { X, ExternalLink, Bookmark, BookmarkCheck, ShieldCheck } from "lucide-react";
import type { JobDTO } from "@/lib/api/dto";
import { salaryLabel, postedLabel, timeAgo, EXPERIENCE_LABELS, EMPLOYMENT_LABELS, EDUCATION_LABELS } from "@/lib/format";
import { EgyptTag, RegionTags } from "./JobCard";
import { SOURCES_META } from "@/lib/taxonomy";

export function JobDrawer({ job, onClose, onSave }: { job: JobDTO | null; onClose: () => void; onSave: (j: JobDTO) => void }) {
  const [full, setFull] = useState<JobDTO | null>(null);
  useEffect(() => {
    setFull(null);
    if (!job) return;
    fetch(`/api/jobs/${job.id}`).then((r) => r.json()).then((d) => setFull(d.job)).catch(() => setFull(job));
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [job, onClose]);
  if (!job) return null;
  const j = full ?? job;
  const sourceName = (id: string) => SOURCES_META.find((s) => s.id === id)?.name ?? id;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={job.title}>
      <button className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-label="Close" />
      <div className="relative flex h-full w-full max-w-2xl flex-col overflow-hidden animate-rise" style={{ background: "var(--bg-solid)" }}>
        <div className="flex items-start gap-3 border-b p-5" style={{ borderColor: "var(--edge)" }}>
          <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl text-xl font-extrabold" style={{ background: "var(--accent-soft)", color: "var(--accent-ink)" }}>{j.companyLogo ? <img src={j.companyLogo} alt="" className="h-full w-full object-contain" /> : j.company.charAt(0)}</div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-extrabold leading-tight">{j.title}</h2>
            <div className="mt-0.5 font-semibold" style={{ color: "var(--ink-soft)" }}>{j.company}</div>
          </div>
          <button onClick={onClose} className="btn btn-ghost h-9 w-9 p-0" aria-label="Close"><X size={18} /></button>
        </div>

        <div className="scrollbar-thin flex-1 overflow-y-auto p-5">
          <div className="flex flex-wrap gap-1.5">
            <span className="tag" style={{ background: "var(--ok-soft)", color: "var(--ok)" }}>🟢 Fully remote</span>
            <EgyptTag v={j.egyptEligible} /><RegionTags regions={j.eligibleRegions} />
            <span className="tag" style={{ background: "var(--hot-soft)", color: "var(--hot)" }}>💰 {salaryLabel(j)}</span>
            <span className="tag" style={{ background: "var(--edge)", color: "var(--ink-soft)" }}>🎯 {EXPERIENCE_LABELS[j.experience]}</span>
            <span className="tag" style={{ background: "var(--edge)", color: "var(--ink-soft)" }}>{EMPLOYMENT_LABELS[j.employmentType]}</span>
            <span className="tag" style={{ background: "var(--edge)", color: "var(--ink-soft)" }}>🎓 {EDUCATION_LABELS[j.education]}</span>
            <span className="tag" style={{ background: "var(--edge)", color: "var(--ink-soft)" }}>🕐 {postedLabel(j.postedAt)}</span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl p-4" style={{ background: "var(--accent-soft)" }}>
              <div className="text-sm font-extrabold" style={{ color: "var(--accent-ink)" }}>⭐ {j.matchScore}% match</div>
              <ul className="mt-1.5 space-y-0.5 text-sm">{j.matchReasons.map((r) => <li key={r}>✓ {r}</li>)}</ul>
              {j.eligibilityNote && <p className="mt-2 text-xs" style={{ color: "var(--ink-soft)" }}>{j.eligibilityNote}</p>}
            </div>
            <div className="rounded-2xl p-4" style={{ background: j.verification === "VERIFIED" ? "var(--ok-soft)" : "var(--warn-soft)" }}>
              <div className="flex items-center gap-1.5 text-sm font-extrabold" style={{ color: j.verification === "VERIFIED" ? "var(--ok)" : "var(--warn)" }}><ShieldCheck size={15} /> Trust score {j.trustScore}/100 — {j.trustLabel}</div>
              <ul className="mt-1.5 space-y-0.5 text-sm">{j.trustReasons.map((r) => <li key={r}>• {r}</li>)}</ul>
              <p className="mt-2 text-xs" style={{ color: "var(--ink-soft)" }}>{j.lastVerifiedAt ? `Application page checked ${timeAgo(j.lastVerifiedAt)}.` : "Application page not checked yet."}</p>
            </div>
          </div>

          {j.skills.length > 0 && <div className="mt-4"><div className="mb-1.5 text-sm font-bold">Skills mentioned</div><div className="flex flex-wrap gap-1.5">{j.skills.map((s) => <span key={s} className="chip">{s}</span>)}</div></div>}
          {(j.languages.length > 0 || j.arabicRequired || j.englishRequired) && <div className="mt-3 text-sm"><span className="font-bold">Languages:</span> {j.languages.join(", ") || "not stated"}{j.arabicRequired ? " · Arabic required" : ""}{j.englishRequired ? " · English required" : ""}</div>}

          <div className="mt-5">
            <div className="mb-1.5 text-sm font-bold">Job description</div>
            {full ? <div className="whitespace-pre-wrap text-[15px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>{full.description}</div> : <div className="space-y-2">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-4" style={{ width: `${90 - i * 9}%` }} />)}</div>}
          </div>

          {j.sources.length > 0 && (
            <div className="mt-5 text-sm">
              <div className="mb-1.5 font-bold">Found on {j.sourceCount} source{j.sourceCount > 1 ? "s" : ""}</div>
              <ul className="space-y-1">{j.sources.map((s) => <li key={s.id}><a href={s.url} target="_blank" rel="noopener noreferrer nofollow" className="underline" style={{ color: "var(--accent-ink)" }}>{sourceName(s.id)}</a></li>)}</ul>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 border-t p-4" style={{ borderColor: "var(--edge)" }}>
          <a href={j.applyUrl} target="_blank" rel="noopener noreferrer nofollow" className="btn btn-primary flex-1 py-3 text-base">Apply now 🚀 <ExternalLink size={16} /></a>
          <button onClick={() => onSave(j)} className="btn btn-ghost py-3">{j.saved ? <BookmarkCheck size={17} /> : <Bookmark size={17} />} {j.saved ? "Saved" : "Save"}</button>
        </div>
        <div className="px-4 pb-3 text-center text-xs" style={{ color: "var(--ink-faint)" }}>{j.applyUrlIsOfficial ? "Opens the company's official application page." : "Opens the listing on the source site."}</div>
      </div>
    </div>
  );
}
