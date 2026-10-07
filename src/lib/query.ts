import type { Prisma } from "@prisma/client";
import type { Filters } from "./filters";
import { POSTED_HOURS } from "./filters";
import { REGION_BY_CODE, USD_RATES } from "./taxonomy";

/** Base visibility rules (spec §2, §16, §17, §25): only real, open, fully remote, non-suspicious jobs. */
export const VISIBLE_WHERE: Prisma.JobWhereInput = {
  remoteStatus: "FULLY_REMOTE",
  applicationStatus: { not: "CLOSED" },
  scamFlags: { isEmpty: true },
  verification: { not: "SUSPICIOUS" },
};

export function buildWhere(f: Filters): Prisma.JobWhereInput {
  const and: Prisma.JobWhereInput[] = [VISIBLE_WHERE];

  if (f.status) and.push({ applicationStatus: f.status });
  if (f.q) {
    const terms = f.q.split(/\s+/).filter((t) => t.length > 1).slice(0, 6);
    for (const t of terms) and.push({ OR: [{ title: { contains: t, mode: "insensitive" } }, { company: { contains: t, mode: "insensitive" } }, { skills: { has: capitalize(t) } }, { subCategory: { contains: t, mode: "insensitive" } }, { description: { contains: t, mode: "insensitive" } }] });
  }
  if (f.regions.length) {
    // Expand: a filter for EG also matches jobs open to EMEA / Middle East / Africa / Worldwide.
    const codes = new Set<string>(["WORLDWIDE"]);
    for (const c of f.regions) { codes.add(c); for (const r of Object.values(REGION_BY_CODE)) if (r.includes?.includes(c)) codes.add(r.code); }
    and.push({ eligibleRegions: { hasSome: Array.from(codes) } });
  }
  if (f.egypt) and.push({ egyptEligible: f.egypt });
  if (f.categories.length) and.push({ category: { in: f.categories } });
  if (f.experience.length) and.push({ experience: { in: f.experience as Prisma.EnumExperienceLevelFilter["in"] } });
  if (f.employment.length) and.push({ employmentType: { in: f.employment as Prisma.EnumEmploymentTypeFilter["in"] } });
  if (f.education.length) and.push({ education: { in: f.education as Prisma.EnumEducationFilter["in"] } });
  if (f.posted) and.push({ postedAt: { gte: new Date(Date.now() - POSTED_HOURS[f.posted] * 3_600_000) } });

  const rate = USD_RATES[f.currency] ?? 1;
  if (f.hourlyMin) and.push({ salaryHourlyUsd: { gte: f.hourlyMin } });
  if (f.salaryMin) and.push({ salaryHourlyUsd: { gte: Math.round(toHourly(f.salaryMin, rate)) } });
  if (f.salaryMax) and.push({ salaryHourlyUsd: { lte: Math.round(toHourly(f.salaryMax, rate)) } });

  if (f.skills.length) and.push({ skills: { hasSome: f.skills } });
  if (f.languages.length) and.push({ languages: { hasSome: f.languages } });
  if (f.arabicRequired) and.push({ arabicRequired: f.arabicRequired === "YES" });
  if (f.englishRequired) and.push({ englishRequired: f.englishRequired === "YES" });
  if (f.companyType.length) and.push({ companyType: { in: f.companyType as Prisma.EnumCompanyTypeFilter["in"] } });
  if (f.companyCountry) and.push({ companyCountry: f.companyCountry });
  if (f.sources.length) and.push({ listings: { some: { sourceId: { in: f.sources }, isAlive: true } } });
  if (f.verification.length) and.push({ verification: { in: f.verification as Prisma.EnumVerificationFilter["in"] } });

  return { AND: and };
}

/** A user typing a monthly/yearly figure: guess period by magnitude, convert to hourly USD. */
function toHourly(amount: number, rate: number): number {
  const usd = amount * rate;
  if (usd < 200) return usd;
  if (usd < 15_000) return usd / 173;
  return usd / 2080;
}

export function buildOrderBy(sort: Filters["sort"]): Prisma.JobOrderByWithRelationInput[] {
  switch (sort) {
    case "newest": return [{ postedAt: "desc" }];
    case "salary": return [{ salaryHourlyUsd: { sort: "desc", nulls: "last" } }, { postedAt: "desc" }];
    case "company": return [{ company: "asc" }, { postedAt: "desc" }];
    case "relevant": return [{ trustScore: "desc" }, { postedAt: "desc" }];
    // recommended / match: fetched by freshness+trust, then re-ranked in memory by match score
    default: return [{ postedAt: "desc" }, { trustScore: "desc" }];
  }
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
