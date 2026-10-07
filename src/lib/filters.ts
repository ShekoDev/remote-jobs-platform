import { z } from "zod";

export const SORT_OPTIONS = ["recommended", "newest", "salary", "match", "company", "relevant"] as const;
export type SortKey = (typeof SORT_OPTIONS)[number];

export const POSTED_OPTIONS = ["today", "24h", "3d", "7d", "14d", "30d"] as const;
export type PostedKey = (typeof POSTED_OPTIONS)[number];

export const POSTED_HOURS: Record<PostedKey, number> = {
  today: 24, "24h": 24, "3d": 72, "7d": 168, "14d": 336, "30d": 720,
};

const csv = z
  .string()
  .optional()
  .transform((v) => (v ? v.split(",").map((s) => s.trim()).filter(Boolean) : []));

export const FiltersSchema = z.object({
  q: z.string().optional().default(""),
  regions: csv,                       // WORLDWIDE, EG, SA...
  egypt: z.enum(["YES", "NO", "UNKNOWN"]).optional(),
  categories: csv,
  experience: csv,                    // ExperienceLevel values
  employment: csv,                    // EmploymentType values
  posted: z.enum(POSTED_OPTIONS).optional().default("7d"),
  salaryMin: z.coerce.number().optional(),
  salaryMax: z.coerce.number().optional(),
  currency: z.string().optional().default("USD"),
  hourlyMin: z.coerce.number().optional(), // quick $10+/hour etc
  skills: csv,
  education: csv,
  languages: csv,
  arabicRequired: z.enum(["YES", "NO"]).optional(),
  englishRequired: z.enum(["YES", "NO"]).optional(),
  companyType: csv,
  companyCountry: z.string().optional(),
  sources: csv,
  verification: csv,                  // VERIFIED, NEEDS_VERIFICATION, SUSPICIOUS
  status: z.enum(["ACCEPTING", "CLOSED", "UNKNOWN"]).optional(),
  sort: z.enum(SORT_OPTIONS).optional().default("recommended"),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(60).optional().default(20),
});

export type Filters = z.infer<typeof FiltersSchema>;

export const DEFAULT_FILTERS: Filters = FiltersSchema.parse({});

export function filtersFromSearchParams(sp: URLSearchParams | Record<string, string | undefined>): Filters {
  const obj: Record<string, string | undefined> =
    sp instanceof URLSearchParams ? Object.fromEntries(sp.entries()) : sp;
  const parsed = FiltersSchema.safeParse(obj);
  return parsed.success ? parsed.data : DEFAULT_FILTERS;
}

export function filtersToSearchParams(f: Partial<Filters>): URLSearchParams {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) {
    if (v === undefined || v === null || v === "") continue;
    if (Array.isArray(v)) {
      if (v.length) sp.set(k, v.join(","));
      continue;
    }
    // omit defaults to keep URLs short
    if (k === "posted" && v === "7d") continue;
    if (k === "sort" && v === "recommended") continue;
    if (k === "page" && v === 1) continue;
    if (k === "pageSize" && v === 20) continue;
    if (k === "currency" && v === "USD") continue;
    sp.set(k, String(v));
  }
  return sp;
}

/** Counts user-visible active filters (excludes paging/sort/default posted). */
export function countActiveFilters(f: Filters): number {
  let n = 0;
  if (f.q) n++;
  n += f.regions.length + f.categories.length + f.experience.length + f.employment.length;
  n += f.skills.length + f.education.length + f.languages.length + f.companyType.length;
  n += f.sources.length + f.verification.length;
  if (f.egypt) n++;
  if (f.posted !== "7d") n++;
  if (f.salaryMin || f.salaryMax || f.hourlyMin) n++;
  if (f.arabicRequired || f.englishRequired) n++;
  if (f.companyCountry) n++;
  if (f.status) n++;
  return n;
}
