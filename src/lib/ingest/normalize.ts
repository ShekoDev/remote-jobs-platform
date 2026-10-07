import type { RawListing } from "../sources/types";
import { CATEGORIES, REGIONS, SKILLS, LANGUAGES, USD_RATES } from "../taxonomy";

// Local string-literal copies of the Prisma enums so this module can run in the
// worker without importing @prisma/client types.
export type RemoteStatus = "FULLY_REMOTE" | "HYBRID" | "ONSITE" | "UNKNOWN";
export type Eligibility = "YES" | "NO" | "UNKNOWN";
export type ExperienceLevel = "NO_EXPERIENCE" | "ENTRY" | "JUNIOR" | "MID" | "SENIOR" | "LEAD" | "MANAGER" | "DIRECTOR" | "UNKNOWN";
export type EmploymentType = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "FREELANCE" | "TEMPORARY" | "INTERNSHIP" | "UNKNOWN";
export type Education = "NO_DEGREE" | "HIGH_SCHOOL" | "DIPLOMA" | "BACHELORS" | "MASTERS" | "PHD" | "UNKNOWN";

export type NormalizedJob = {
  fingerprint: string;
  title: string;
  company: string;
  companyLogo?: string;
  companyUrl?: string;
  companyCountry?: string;
  description: string;
  category: string;
  subCategory?: string;
  remoteStatus: RemoteStatus;
  remoteEvidence?: string;
  eligibleRegions: string[];
  egyptEligible: Eligibility;
  eligibilityNote?: string;
  experience: ExperienceLevel;
  employmentType: EmploymentType;
  education: Education;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  salaryPeriod?: string;
  salaryHourlyUsd?: number;
  skills: string[];
  languages: string[];
  arabicRequired: boolean;
  englishRequired: boolean;
  postedAt: Date;
  expiresAt?: Date;
  applyUrl: string;
  applyUrlIsOfficial: boolean;
};

// ---------- helpers ----------

export function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>|<\/p>|<\/li>|<\/h\d>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&rsquo;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n\n")
    .trim();
}

export function normalizeCompany(c: string): string {
  return c.toLowerCase().replace(/\b(inc|llc|ltd|limited|gmbh|corp|corporation|co|company|s\.?a\.?)\b\.?/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

export function normalizeTitle(t: string): string {
  return t.toLowerCase()
    .replace(/\(.*?\)|\[.*?\]/g, " ")
    .replace(/\b(remote|wfh|work from home|worldwide|100%|fully|anywhere|urgent|hiring|now)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function fingerprint(company: string, title: string): string {
  return `${normalizeCompany(company)}|${normalizeTitle(title)}`.slice(0, 200);
}

const hasAny = (text: string, phrases: string[]) => phrases.find((p) => text.includes(p));

// ---------- remote status ----------

const HYBRID_PHRASES = ["hybrid", "remote + office", "remote/office", "days in the office", "days per week in office", "in-office days", "come into the office", "attend the office", "office attendance", "must be able to commute", "some travel required", "occasional travel to", "periodic visits to", "on-site presence", "partially remote", "remote-first with"];
const ONSITE_PHRASES = ["on-site", "onsite", "on site only", "office-based", "in office", "in-office", "relocation required", "must relocate", "this role is not remote", "not a remote position", "in person"];
const REMOTE_PHRASES = ["fully remote", "100% remote", "remote-only", "remote only", "work from home", "work-from-home", "wfh", "work from anywhere", "worldwide remote", "remote worldwide", "remote (worldwide)", "remote anywhere", "telecommute", "remote position", "this is a remote role", "this role is remote", "remote role", "remote job", "remote"];

export function detectRemote(raw: RawListing, text: string): { status: RemoteStatus; evidence?: string } {
  const loc = (raw.location || "").toLowerCase();
  const head = (raw.title + " " + loc + " " + (raw.tags || []).join(" ")).toLowerCase();

  // Hybrid / onsite are decisive wherever they appear in the listing.
  const hybrid = hasAny(head, HYBRID_PHRASES) || hasAny(text, HYBRID_PHRASES);
  if (hybrid) return { status: "HYBRID", evidence: hybrid };
  const onsite = hasAny(head, ONSITE_PHRASES) || hasAny(text, ONSITE_PHRASES);
  // "in person interview" / "in-person onboarding" are not location constraints; keep it simple but avoid that false positive.
  if (onsite && !/in.person (interview|onboarding|meetup|event)/.test(text)) return { status: "ONSITE", evidence: onsite };

  const remote = hasAny(head, REMOTE_PHRASES) || hasAny(text, REMOTE_PHRASES);
  if (remote) return { status: "FULLY_REMOTE", evidence: remote };
  return { status: "UNKNOWN" };
}

// ---------- eligibility ----------

const NEGATIVE_MARKERS = ["only", "must be located", "must reside", "based in", "residents of", "authorized to work in", "eligible to work in", "work authorization", "within the", "restricted to", "candidates from", "located in"];

export function detectEligibility(raw: RawListing, text: string): { regions: string[]; egypt: Eligibility; note?: string } {
  const loc = (raw.location || "").toLowerCase().trim();
  const regions = new Set<string>();

  // 1) The source's own location field is the most reliable signal.
  if (loc) {
    for (const r of REGIONS) if (r.aliases.some((a) => matchWord(loc, a))) regions.add(r.code);
    if (/^(remote|anywhere|global|worldwide|any)$/i.test(loc) || /worldwide|anywhere/.test(loc)) regions.add("WORLDWIDE");
  }

  // 2) Explicit restriction sentences in the description.
  const sentences = text.toLowerCase().split(/(?<=[.!?\n])\s+/).filter((s) => NEGATIVE_MARKERS.some((m) => s.includes(m)) || s.includes("worldwide") || s.includes("anywhere"));
  const restricted = new Set<string>();
  for (const s of sentences) {
    for (const r of REGIONS) if (r.aliases.some((a) => matchWord(s, a))) restricted.add(r.code);
    if (/(work from anywhere|anywhere in the world|worldwide|any location|no location restriction)/.test(s)) restricted.add("WORLDWIDE");
  }

  // If the description names specific regions in a restriction sentence, trust that over a vague location field.
  const final = restricted.size ? Array.from(restricted) : Array.from(regions);

  if (!final.length) return { regions: [], egypt: "UNKNOWN", note: "The listing does not state where candidates must be located." };

  const worldwide = final.includes("WORLDWIDE");
  const egyptIn = final.some((code) => code === "EG" || REGIONS.find((r) => r.code === code)?.includes?.includes("EG"));
  if (worldwide && !restricted.size) return { regions: ["WORLDWIDE"], egypt: "YES", note: `Listing says: ${loc || "worldwide"}` };
  if (worldwide && restricted.size && !egyptIn && restricted.size > 1) {
    // "worldwide" plus named exclusions/inclusions elsewhere — ambiguous
    return { regions: final, egypt: "UNKNOWN", note: "Mentions worldwide but also names specific countries; check the listing." };
  }
  if (egyptIn) return { regions: final, egypt: "YES", note: `Open to ${final.join(", ")}` };
  return { regions: final, egypt: "NO", note: `Restricted to ${final.join(", ")}` };
}

function matchWord(hay: string, needle: string): boolean {
  if (needle.length <= 3) return new RegExp(`(^|[^a-z])${escape(needle)}([^a-z]|$)`, "i").test(hay);
  return hay.includes(needle);
}
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ---------- category ----------

export function detectCategory(raw: RawListing, text: string): { category: string; subCategory?: string } {
  const title = raw.title.toLowerCase();
  // Pass 1: title vs sub-categories (most specific match wins → longest alias)
  let best: { slug: string; sub: string; len: number } | undefined;
  for (const c of CATEGORIES) {
    for (const sub of c.subs) {
      const s = sub.toLowerCase();
      if (title.includes(s) && (!best || s.length > best.len)) best = { slug: c.slug, sub, len: s.length };
    }
  }
  if (best) return { category: best.slug, subCategory: best.sub };
  // Pass 2: keywords in title
  for (const c of CATEGORIES) for (const k of c.keywords || []) if (matchWord(title, k)) return { category: c.slug, subCategory: undefined };
  // Pass 3: source's own category / tags
  const srcCat = ((raw.category || "") + " " + (raw.tags || []).join(" ")).toLowerCase();
  const map: [RegExp, string][] = [
    [/data|analytics/, "data"], [/admin|assistant/, "admin"], [/customer|support/, "customer_service"], [/sales/, "sales"],
    [/marketing/, "marketing"], [/finance|account/, "finance"], [/hr|human|recruit|people/, "hr"], [/software|dev|engineer|it|tech|qa|devops/, "it"],
    [/design/, "design"], [/writ|content|editor/, "writing"], [/product|project|operations|management/, "operations"], [/ai|machine|ml/, "ai"],
  ];
  for (const [re, slug] of map) if (re.test(srcCat)) return { category: slug };
  return { category: "other" };
}

// ---------- experience ----------

export function detectExperience(raw: RawListing, text: string): ExperienceLevel {
  const t = raw.title.toLowerCase();
  const s = (raw.seniority || "").toLowerCase();
  if (/\b(director|vp|vice president|head of|chief)\b/.test(t)) return "DIRECTOR";
  if (/\bmanager\b/.test(t) && !/\baccount manager|community manager|content manager|social media manager\b/.test(t)) return "MANAGER";
  if (/\b(lead|principal|staff)\b/.test(t) || /lead/.test(s)) return "LEAD";
  if (/\b(senior|sr\.?)\b/.test(t) || /senior/.test(s)) return "SENIOR";
  if (/\b(junior|jr\.?)\b/.test(t) || /junior/.test(s)) return "JUNIOR";
  if (/\b(intern|internship|trainee|graduate|entry[- ]level)\b/.test(t) || /entry/.test(s)) return "ENTRY";
  if (/no experience (required|needed|necessary)|no prior experience|experience not required|we will train|training provided/.test(text)) return "NO_EXPERIENCE";
  if (/\bmid[- ]?level\b|intermediate/.test(t + " " + s)) return "MID";
  const yrs = text.match(/(\d+)\+?\s*(?:-\s*\d+\s*)?years?(?: of)? (?:experience|exp)/);
  if (yrs) {
    const n = parseInt(yrs[1], 10);
    if (n === 0) return "NO_EXPERIENCE";
    if (n <= 1) return "ENTRY";
    if (n <= 2) return "JUNIOR";
    if (n <= 5) return "MID";
    return "SENIOR";
  }
  return "UNKNOWN";
}

export function detectEmployment(raw: RawListing, text: string): EmploymentType {
  const s = ((raw.jobType || "") + " " + raw.title + " " + (raw.tags || []).join(" ")).toLowerCase();
  if (/intern/.test(s)) return "INTERNSHIP";
  if (/freelanc/.test(s)) return "FREELANCE";
  if (/contract|contractor|b2b/.test(s)) return "CONTRACT";
  if (/temp|temporary|seasonal/.test(s)) return "TEMPORARY";
  if (/part[- ]?time/.test(s)) return "PART_TIME";
  if (/full[- ]?time|permanent/.test(s)) return "FULL_TIME";
  if (/part[- ]time/.test(text)) return "PART_TIME";
  if (/full[- ]time/.test(text)) return "FULL_TIME";
  return "UNKNOWN";
}

export function detectEducation(text: string): Education {
  if (/no degree (required|necessary)|degree not required|without a degree|no formal education/.test(text)) return "NO_DEGREE";
  if (/\b(phd|ph\.d|doctorate)\b/.test(text)) return "PHD";
  if (/\b(master'?s?|msc|mba)\b/.test(text)) return "MASTERS";
  if (/\b(bachelor'?s?|bsc|b\.s\.|ba degree|university degree|college degree)\b/.test(text)) return "BACHELORS";
  if (/\bdiploma\b|associate'?s? degree/.test(text)) return "DIPLOMA";
  if (/high school|secondary school|ged\b/.test(text)) return "HIGH_SCHOOL";
  return "UNKNOWN";
}

export function detectSkills(raw: RawListing, text: string): string[] {
  const hay = ` ${raw.title.toLowerCase()} ${(raw.tags || []).join(" ").toLowerCase()} ${text} `;
  const found: string[] = [];
  for (const s of SKILLS) if (s.aliases.some((a) => hay.includes(a.toLowerCase()))) found.push(s.name);
  return found.slice(0, 12);
}

export function detectLanguages(text: string): { languages: string[]; arabicRequired: boolean; englishRequired: boolean } {
  const languages = LANGUAGES.filter((l) => l.aliases.some((a) => text.includes(a))).map((l) => l.name);
  const req = (lang: string) => new RegExp(`(fluent|native|proficien|professional|required|must|strong|excellent|advanced|business)[^.\\n]{0,40}\\b${lang}\\b|\\b${lang}\\b[^.\\n]{0,40}(required|mandatory|is a must|fluency|proficiency|native|essential)`).test(text);
  return { languages, arabicRequired: req("arabic"), englishRequired: req("english") };
}

export function normalizeSalary(raw: RawListing, text: string) {
  let s = raw.salary;
  if (!s || (!s.min && !s.max)) {
    // try to pull "$15 - $20 per hour" or "$45,000 - $60,000 / year" from text
    const m = text.match(/(\$|€|£)\s?(\d[\d,]*(?:\.\d+)?)(?:\s?k)?\s?(?:-|–|to)\s?(\$|€|£)?\s?(\d[\d,]*(?:\.\d+)?)(?:\s?k)?\s?(?:\/|per)?\s?(hour|hr|month|year|annum)?/i);
    if (m) {
      const toN = (v: string, k: boolean) => parseFloat(v.replace(/,/g, "")) * (k ? 1000 : 1);
      const kFlag = /k/i.test(m[0]);
      s = { min: toN(m[2], kFlag), max: toN(m[4], kFlag), currency: m[1] === "€" ? "EUR" : m[1] === "£" ? "GBP" : "USD", period: /hour|hr/i.test(m[5] || "") ? "hour" : /month/i.test(m[5] || "") ? "month" : /year|annum/i.test(m[5] || "") ? "year" : undefined, raw: m[0] };
    }
  }
  if (!s || (!s.min && !s.max)) return {};
  const min = s.min, max = s.max, currency = (s.currency || "USD").toUpperCase();
  let period = s.period;
  const ref = max ?? min ?? 0;
  if (!period) period = ref < 200 ? "hour" : ref < 15000 ? "month" : "year";
  const rate = USD_RATES[currency] ?? 1;
  const hourly = (v: number) => (period === "hour" ? v : period === "month" ? v / 173 : v / 2080) * rate;
  const basis = min ?? max!;
  return { salaryMin: min ? Math.round(min) : undefined, salaryMax: max ? Math.round(max) : undefined, salaryCurrency: currency, salaryPeriod: period, salaryHourlyUsd: Math.round(hourly(basis)) };
}

export function detectCompanyCountry(raw: RawListing, text: string): string | undefined {
  const m = text.match(/(?:headquartered|based|located) in ([A-Z][a-zA-Z ]{2,30})/);
  if (!m) return undefined;
  const name = m[1].trim().toLowerCase();
  const r = REGIONS.find((r) => r.aliases.includes(name));
  return r?.code;
}

// ---------- main ----------

export function normalize(raw: RawListing): NormalizedJob {
  const description = stripHtml(raw.description || "").slice(0, 20_000);
  const text = description.toLowerCase();
  const remote = detectRemote(raw, text);
  const elig = detectEligibility(raw, text);
  const cat = detectCategory(raw, text);
  const lang = detectLanguages(text);
  const salary = normalizeSalary(raw, text);
  const applyUrl = raw.applyUrl || raw.url;
  const boards = ["remotive.com", "remoteok.com", "jobicy.com", "arbeitnow.com", "himalayas.app", "weworkremotely.com", "workingnomads.com", "linkedin.com", "indeed.com", "glassdoor."];
  const applyUrlIsOfficial = !boards.some((b) => applyUrl.includes(b));

  return {
    fingerprint: fingerprint(raw.company, raw.title),
    title: raw.title.trim().slice(0, 200),
    company: raw.company.trim().slice(0, 120),
    companyLogo: raw.companyLogo,
    companyUrl: raw.companyUrl,
    companyCountry: detectCompanyCountry(raw, description),
    description,
    category: cat.category,
    subCategory: cat.subCategory,
    remoteStatus: remote.status,
    remoteEvidence: remote.evidence,
    eligibleRegions: elig.regions,
    egyptEligible: elig.egypt,
    eligibilityNote: elig.note,
    experience: detectExperience(raw, text),
    employmentType: detectEmployment(raw, text),
    education: detectEducation(text),
    ...salary,
    skills: detectSkills(raw, text),
    languages: lang.languages,
    arabicRequired: lang.arabicRequired,
    englishRequired: lang.englishRequired,
    postedAt: raw.postedAt,
    expiresAt: raw.expiresAt,
    applyUrl,
    applyUrlIsOfficial,
  };
}
