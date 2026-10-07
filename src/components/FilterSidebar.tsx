"use client";
import { useState } from "react";
import { ChevronDown, RotateCcw, Search } from "lucide-react";
import { useFilters } from "@/hooks/useFilters";
import { CATEGORIES, REGIONS, SKILLS, LANGUAGES, SOURCES_META, CURRENCIES } from "@/lib/taxonomy";
import { countActiveFilters, type Filters, type PostedKey } from "@/lib/filters";
import { EXPERIENCE_LABELS, EMPLOYMENT_LABELS, EDUCATION_LABELS, COMPANY_TYPE_LABELS } from "@/lib/format";

function Group({ title, children, defaultOpen = true, count }: { title: string; children: React.ReactNode; defaultOpen?: boolean; count?: number }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b py-3 last:border-0" style={{ borderColor: "var(--edge)" }}>
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between py-1 text-sm font-bold" aria-expanded={open}>
        <span className="flex items-center gap-2">{title}{count ? <span className="tag" style={{ background: "var(--accent-soft)", color: "var(--accent-ink)" }}>{count}</span> : null}</span>
        <ChevronDown size={16} className={`transition ${open ? "rotate-180" : ""}`} style={{ color: "var(--ink-faint)" }} />
      </button>
      {open && <div className="mt-2 animate-rise">{children}</div>}
    </div>
  );
}

function Checks({ items, selected, onToggle }: { items: { value: string; label: string }[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <div className="flex flex-col">
      {items.map((it) => (
        <label key={it.value} className="check">
          <input type="checkbox" checked={selected.includes(it.value)} onChange={() => onToggle(it.value)} />
          <span>{it.label}</span>
        </label>
      ))}
    </div>
  );
}

function Tri({ value, onChange, labels = ["Yes", "No", "Unknown"] }: { value?: string; onChange: (v?: "YES" | "NO" | "UNKNOWN") => void; labels?: string[] }) {
  const opts: { v: "YES" | "NO" | "UNKNOWN"; l: string; dot: string }[] = [{ v: "YES", l: labels[0], dot: "var(--ok)" }, { v: "NO", l: labels[1], dot: "var(--bad)" }, { v: "UNKNOWN", l: labels[2], dot: "var(--warn)" }];
  return (
    <div className="grid grid-cols-3 gap-1 rounded-xl p-1" style={{ background: "var(--accent-soft)" }}>
      {opts.map((o) => (
        <button key={o.v} onClick={() => onChange(value === o.v ? undefined : o.v)} className="flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold transition"
          style={value === o.v ? { background: "var(--bg-solid)", boxShadow: "var(--shadow)", color: "var(--ink)" } : { color: "var(--ink-soft)" }}>
          <span className="h-2 w-2 rounded-full" style={{ background: o.dot }} />{o.l}
        </button>
      ))}
    </div>
  );
}

export function FilterSidebar({ onClose }: { onClose?: () => void }) {
  const { filters: f, set, toggle, clear } = useFilters();
  const [regionQ, setRegionQ] = useState("");
  const [skillQ, setSkillQ] = useState("");
  const active = countActiveFilters(f);
  const postedOpts: { v: PostedKey; l: string }[] = [{ v: "today", l: "Today" }, { v: "24h", l: "Last 24 hours" }, { v: "3d", l: "Last 3 days" }, { v: "7d", l: "Last 7 days" }, { v: "14d", l: "Last 14 days" }, { v: "30d", l: "Last 30 days" }];
  const regions = REGIONS.filter((r) => !regionQ || r.label.toLowerCase().includes(regionQ.toLowerCase()));
  const skillList = SKILLS.map((s) => s.name).filter((s) => !skillQ || s.toLowerCase().includes(skillQ.toLowerCase()));
  const customSkill = skillQ.trim() && !SKILLS.some((s) => s.name.toLowerCase() === skillQ.trim().toLowerCase());

  return (
    <aside className="card flex max-h-[calc(100vh-6rem)] flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: "var(--edge)" }}>
        <div className="font-extrabold">Filters {active > 0 && <span className="tag ml-1" style={{ background: "var(--accent)", color: "#fff" }}>{active}</span>}</div>
        <div className="flex items-center gap-2">
          {active > 0 && <button onClick={clear} className="flex items-center gap-1 text-xs font-bold" style={{ color: "var(--accent-ink)" }}><RotateCcw size={13} /> Clear all</button>}
          {onClose && <button onClick={onClose} className="btn btn-ghost px-3 py-1 text-xs">Done</button>}
        </div>
      </div>

      <div className="scrollbar-thin flex-1 overflow-y-auto px-4">
        <Group title="🇪🇬 Can apply from Egypt?">
          <Tri value={f.egypt} onChange={(v) => set({ egypt: v })} />
          <p className="mt-2 text-xs" style={{ color: "var(--ink-faint)" }}>Based only on what the listing states. Unknown means the listing does not say.</p>
        </Group>

        <Group title="🌍 Location" count={f.regions.length}>
          <div className="relative mb-2"><Search size={14} className="absolute left-2.5 top-2.5" style={{ color: "var(--ink-faint)" }} /><input className="input pl-8" placeholder="Search countries" value={regionQ} onChange={(e) => setRegionQ(e.target.value)} /></div>
          <div className="max-h-56 overflow-y-auto scrollbar-thin"><Checks items={regions.map((r) => ({ value: r.code, label: `${r.flag} ${r.label}` }))} selected={f.regions} onToggle={(v) => toggle("regions", v)} /></div>
        </Group>

        <Group title="Job category" count={f.categories.length}>
          <Checks items={CATEGORIES.map((c) => ({ value: c.slug, label: `${c.emoji} ${c.label}` }))} selected={f.categories} onToggle={(v) => toggle("categories", v)} />
        </Group>

        <Group title="Experience" count={f.experience.length}>
          <Checks items={Object.entries(EXPERIENCE_LABELS).filter(([k]) => k !== "UNKNOWN").map(([value, label]) => ({ value, label }))} selected={f.experience} onToggle={(v) => toggle("experience", v)} />
        </Group>

        <Group title="Employment type" count={f.employment.length}>
          <Checks items={Object.entries(EMPLOYMENT_LABELS).filter(([k]) => k !== "UNKNOWN").map(([value, label]) => ({ value, label }))} selected={f.employment} onToggle={(v) => toggle("employment", v)} />
        </Group>

        <Group title="Posted">
          <div className="flex flex-wrap gap-1.5">{postedOpts.map((o) => <button key={o.v} className="chip" data-on={f.posted === o.v} onClick={() => set({ posted: o.v })}>{o.l}</button>)}</div>
        </Group>

        <Group title="Salary" defaultOpen={false} count={f.hourlyMin || f.salaryMin || f.salaryMax ? 1 : 0}>
          <div className="mb-2 flex flex-wrap gap-1.5">{[10, 15, 20, 30, 50].map((n) => <button key={n} className="chip" data-on={f.hourlyMin === n} onClick={() => set({ hourlyMin: f.hourlyMin === n ? undefined : n })}>${n}+/hour</button>)}</div>
          <div className="grid grid-cols-[1fr_1fr_auto] gap-1.5">
            <input className="input" type="number" placeholder="Min" value={f.salaryMin ?? ""} onChange={(e) => set({ salaryMin: e.target.value ? Number(e.target.value) : undefined }, { replace: true })} />
            <input className="input" type="number" placeholder="Max" value={f.salaryMax ?? ""} onChange={(e) => set({ salaryMax: e.target.value ? Number(e.target.value) : undefined }, { replace: true })} />
            <select className="input w-auto" value={f.currency} onChange={(e) => set({ currency: e.target.value })}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select>
          </div>
          <p className="mt-2 text-xs" style={{ color: "var(--ink-faint)" }}>Enter hourly, monthly or yearly amounts; jobs without a disclosed salary are hidden when a salary filter is on.</p>
        </Group>

        <Group title="Skills" count={f.skills.length}>
          <div className="relative mb-2"><Search size={14} className="absolute left-2.5 top-2.5" style={{ color: "var(--ink-faint)" }} /><input className="input pl-8" placeholder="Type a skill" value={skillQ} onChange={(e) => setSkillQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && skillQ.trim()) { toggle("skills", skillQ.trim()); setSkillQ(""); } }} /></div>
          <div className="flex flex-wrap gap-1.5">
            {f.skills.filter((s) => !skillList.includes(s)).map((s) => <button key={s} className="chip" data-on="true" onClick={() => toggle("skills", s)}>{s}</button>)}
            {skillList.map((s) => <button key={s} className="chip" data-on={f.skills.includes(s)} onClick={() => toggle("skills", s)}>{s}</button>)}
            {customSkill && <button className="chip" onClick={() => { toggle("skills", skillQ.trim()); setSkillQ(""); }}>+ “{skillQ.trim()}”</button>}
          </div>
        </Group>

        <Group title="Languages" defaultOpen={false} count={f.languages.length + (f.arabicRequired ? 1 : 0) + (f.englishRequired ? 1 : 0)}>
          <Checks items={LANGUAGES.map((l) => ({ value: l.name, label: l.name }))} selected={f.languages} onToggle={(v) => toggle("languages", v)} />
          <div className="mt-2 space-y-2">
            <div><div className="mb-1 text-xs font-bold" style={{ color: "var(--ink-soft)" }}>Arabic required</div><Tri value={f.arabicRequired} onChange={(v) => set({ arabicRequired: v === "UNKNOWN" ? undefined : v })} labels={["Yes", "No", "Any"]} /></div>
            <div><div className="mb-1 text-xs font-bold" style={{ color: "var(--ink-soft)" }}>English required</div><Tri value={f.englishRequired} onChange={(v) => set({ englishRequired: v === "UNKNOWN" ? undefined : v })} labels={["Yes", "No", "Any"]} /></div>
          </div>
        </Group>

        <Group title="Education" defaultOpen={false} count={f.education.length}>
          <Checks items={Object.entries(EDUCATION_LABELS).filter(([k]) => k !== "UNKNOWN").map(([value, label]) => ({ value, label }))} selected={f.education} onToggle={(v) => toggle("education", v)} />
        </Group>

        <Group title="Company" defaultOpen={false} count={f.companyType.length + (f.companyCountry ? 1 : 0)}>
          <Checks items={Object.entries(COMPANY_TYPE_LABELS).filter(([k]) => k !== "UNKNOWN").map(([value, label]) => ({ value, label }))} selected={f.companyType} onToggle={(v) => toggle("companyType", v)} />
          <select className="input mt-2" value={f.companyCountry ?? ""} onChange={(e) => set({ companyCountry: e.target.value || undefined })}>
            <option value="">Company location: any</option>
            {REGIONS.filter((r) => r.code !== "WORLDWIDE").map((r) => <option key={r.code} value={r.code}>{r.flag} {r.label}</option>)}
          </select>
        </Group>

        <Group title="Job source" defaultOpen={false} count={f.sources.length}>
          <Checks items={SOURCES_META.map((s) => ({ value: s.id, label: s.name }))} selected={f.sources} onToggle={(v) => toggle("sources", v)} />
        </Group>

        <Group title="Verification" defaultOpen={false} count={f.verification.length + (f.status ? 1 : 0)}>
          <Checks items={[{ value: "VERIFIED", label: "🟢 Verified" }, { value: "NEEDS_VERIFICATION", label: "🟡 Needs verification" }]} selected={f.verification} onToggle={(v) => toggle("verification", v)} />
          <div className="mt-2 text-xs font-bold" style={{ color: "var(--ink-soft)" }}>Application status</div>
          <div className="mt-1 flex gap-1.5">
            <button className="chip" data-on={f.status === "ACCEPTING"} onClick={() => set({ status: f.status === "ACCEPTING" ? undefined : "ACCEPTING" })}>🟢 Accepting</button>
            <button className="chip" data-on={f.status === "UNKNOWN"} onClick={() => set({ status: f.status === "UNKNOWN" ? undefined : "UNKNOWN" })}>⚪ Unknown</button>
          </div>
          <p className="mt-2 text-xs" style={{ color: "var(--ink-faint)" }}>Closed and suspicious jobs never appear in results.</p>
        </Group>
      </div>
    </aside>
  );
}
