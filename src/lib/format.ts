export function timeAgo(d: Date | string): string {
  const t = typeof d === "string" ? new Date(d).getTime() : d.getTime();
  const s = Math.max(0, (Date.now() - t) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hours ago`;
  const days = Math.floor(s / 86400);
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return `${Math.floor(days / 30)} months ago`;
}

export function postedLabel(d: Date | string): string {
  const t = typeof d === "string" ? new Date(d).getTime() : d.getTime();
  const h = (Date.now() - t) / 3_600_000;
  if (h < 24) return "Posted today";
  if (h < 48) return "Posted yesterday";
  return `Posted ${Math.floor(h / 24)} days ago`;
}

const SYMBOL: Record<string, string> = { USD: "$", EUR: "€", GBP: "£", SAR: "SAR ", AED: "AED ", EGP: "EGP ", CAD: "CA$", AUD: "A$" };

export function salaryLabel(j: { salaryMin: number | null; salaryMax: number | null; salaryCurrency: string | null; salaryPeriod: string | null }): string {
  if (!j.salaryMin && !j.salaryMax) return "Salary not disclosed";
  const sym = SYMBOL[j.salaryCurrency || "USD"] ?? `${j.salaryCurrency} `;
  const fmt = (n: number) => (n >= 1000 ? `${sym}${Math.round(n / 1000)}k` : `${sym}${n}`);
  const range = j.salaryMin && j.salaryMax && j.salaryMin !== j.salaryMax ? `${fmt(j.salaryMin)}–${fmt(j.salaryMax)}` : fmt((j.salaryMin ?? j.salaryMax)!);
  const per = j.salaryPeriod === "hour" ? "/hour" : j.salaryPeriod === "month" ? "/month" : "/year";
  return `${range}${per}`;
}

export const EXPERIENCE_LABELS: Record<string, string> = { NO_EXPERIENCE: "No Experience", ENTRY: "Entry Level", JUNIOR: "Junior", MID: "Mid Level", SENIOR: "Senior", LEAD: "Lead", MANAGER: "Manager", DIRECTOR: "Director", UNKNOWN: "Level not stated" };
export const EMPLOYMENT_LABELS: Record<string, string> = { FULL_TIME: "Full Time", PART_TIME: "Part Time", CONTRACT: "Contract", FREELANCE: "Freelance", TEMPORARY: "Temporary", INTERNSHIP: "Internship", UNKNOWN: "Type not stated" };
export const EDUCATION_LABELS: Record<string, string> = { NO_DEGREE: "No Degree Required", HIGH_SCHOOL: "High School", DIPLOMA: "Diploma", BACHELORS: "Bachelor's", MASTERS: "Master's", PHD: "PhD", UNKNOWN: "Not stated" };
export const COMPANY_TYPE_LABELS: Record<string, string> = { STARTUP: "Startup", SMALL: "Small Business", MEDIUM: "Medium Business", ENTERPRISE: "Enterprise", GOVERNMENT: "Government", NGO: "NGO", UNKNOWN: "Not stated" };
export const TRACKER_LABELS: Record<string, string> = { SAVED: "Saved", READY_TO_APPLY: "Ready to Apply", APPLIED: "Applied", ASSESSMENT: "Assessment", INTERVIEW: "Interview", OFFER: "Offer", REJECTED: "Rejected" };
