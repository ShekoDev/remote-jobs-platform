import { regionsInclude } from "./taxonomy";

export type Profile = {
  country: string;
  skills: string[];
  experience: string;
  languages: string[];
  minHourlyUsd?: number | null;
  categories: string[];
  education: string;
};

export const DEFAULT_PROFILE: Profile = {
  country: "EG", skills: [], experience: "ENTRY", languages: ["English", "Arabic"], minHourlyUsd: null, categories: [], education: "UNKNOWN",
};

type JobLike = {
  eligibleRegions: string[]; egyptEligible: string; remoteStatus: string; skills: string[]; experience: string;
  languages: string[]; arabicRequired: boolean; englishRequired: boolean; salaryHourlyUsd: number | null;
  category: string; subCategory: string | null; education: string; postedAt: Date; trustScore: number;
};

const EXP_ORDER = ["NO_EXPERIENCE", "ENTRY", "JUNIOR", "MID", "SENIOR", "LEAD", "MANAGER", "DIRECTOR"];
const EDU_ORDER = ["NO_DEGREE", "HIGH_SCHOOL", "DIPLOMA", "BACHELORS", "MASTERS", "PHD"];

/** Weighted match score (0-100) with human-readable reasons, per section 19 of the spec. */
export function matchScore(job: JobLike, p: Profile): { score: number; reasons: string[] } {
  let score = 0, max = 0;
  const reasons: string[] = [];
  const add = (weight: number, ok: boolean | number, reason?: string) => {
    max += weight;
    const v = typeof ok === "number" ? ok : ok ? 1 : 0;
    score += weight * v;
    if (v >= 0.99 && reason) reasons.push(reason);
  };

  // Location eligibility (25)
  const eligible = p.country === "EG" ? job.egyptEligible === "YES" : regionsInclude(job.eligibleRegions, p.country) || job.eligibleRegions.includes("WORLDWIDE");
  const unknownLoc = p.country === "EG" ? job.egyptEligible === "UNKNOWN" : job.eligibleRegions.length === 0;
  add(25, eligible ? 1 : unknownLoc ? 0.4 : 0, eligible ? (p.country === "EG" ? "Remote from Egypt" : `Open to ${p.country}`) : undefined);

  // Remote status (10) — always full here, non-remote jobs never reach the UI
  add(10, job.remoteStatus === "FULLY_REMOTE", "Fully remote");

  // Skills (20)
  if (p.skills.length) {
    const hit = job.skills.filter((s) => p.skills.includes(s));
    add(20, job.skills.length ? Math.min(1, hit.length / Math.min(3, job.skills.length)) : 0.5, hit.length ? `${hit.slice(0, 3).join(", ")} required` : undefined);
  } else add(20, job.skills.length ? 0.7 : 0.5, job.skills[0] ? `${job.skills[0]} required` : undefined);

  // Experience (15) — full if job level <= profile level, partial if one step above
  const ji = EXP_ORDER.indexOf(job.experience), pi = EXP_ORDER.indexOf(p.experience);
  const expOk = ji === -1 ? 0.6 : ji <= pi ? 1 : ji === pi + 1 ? 0.5 : 0;
  add(15, expOk, expOk === 1 ? labelExp(job.experience) : undefined);

  // Language (10)
  const langs = p.languages.map((l) => l.toLowerCase());
  const langOk = (!job.arabicRequired || langs.includes("arabic")) && (!job.englishRequired || langs.includes("english"));
  add(10, langOk, job.englishRequired ? "English required" : job.arabicRequired ? "Arabic required" : undefined);

  // Salary (8)
  if (p.minHourlyUsd) add(8, job.salaryHourlyUsd ? (job.salaryHourlyUsd >= p.minHourlyUsd ? 1 : 0.2) : 0.5, job.salaryHourlyUsd && job.salaryHourlyUsd >= p.minHourlyUsd ? `$${job.salaryHourlyUsd}+/hour` : undefined);
  else add(8, job.salaryHourlyUsd ? 1 : 0.6, job.salaryHourlyUsd ? "Salary disclosed" : undefined);

  // Category (6)
  add(6, p.categories.length ? p.categories.includes(job.category) : 0.8);

  // Education (4)
  const je = EDU_ORDER.indexOf(job.education), pe = EDU_ORDER.indexOf(p.education);
  add(4, je === -1 ? 0.8 : pe === -1 ? (je <= 1 ? 1 : 0.5) : je <= pe ? 1 : 0.2, job.education === "NO_DEGREE" ? "No degree required" : undefined);

  // Freshness (2)
  const days = (Date.now() - job.postedAt.getTime()) / 86_400_000;
  add(2, days < 1 ? 1 : days < 3 ? 0.8 : days < 7 ? 0.6 : 0.3, days < 1 ? "Posted today" : undefined);

  return { score: Math.round((score / max) * 100), reasons: reasons.slice(0, 5) };
}

export function labelExp(e: string): string {
  return ({ NO_EXPERIENCE: "No experience needed", ENTRY: "Entry level", JUNIOR: "Junior", MID: "Mid level", SENIOR: "Senior", LEAD: "Lead", MANAGER: "Manager", DIRECTOR: "Director", UNKNOWN: "Level not stated" } as Record<string, string>)[e] || e;
}
