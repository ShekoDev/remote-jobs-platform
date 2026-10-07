import { RawListing, SourceAdapter, getJson, toDate, num } from "./types";

type HimalayasJob = {
  guid: string; title: string; description: string; excerpt?: string; companyName: string; companyLogo?: string;
  employmentType?: string; locationRestrictions?: string[]; timezoneRestrictions?: string[]; categories?: string[];
  seniority?: string[]; minSalary?: number; maxSalary?: number; currency?: string; pubDate: number; expiryDate?: number;
  applicationLink?: string;
};

/** Public API: https://himalayas.app/jobs/api (paginated with limit/offset). */
export const himalayas: SourceAdapter = {
  id: "himalayas", name: "Himalayas", kind: "api", homepage: "https://himalayas.app",
  async fetch() {
    const out: RawListing[] = [];
    for (let offset = 0; offset < 400; offset += 100) {
      const data = await getJson<{ jobs: HimalayasJob[] }>(`https://himalayas.app/jobs/api?limit=100&offset=${offset}`);
      if (!data.jobs?.length) break;
      for (const j of data.jobs) {
        out.push({
          sourceId: "himalayas",
          externalId: j.guid,
          url: j.guid,
          applyUrl: j.applicationLink,
          title: j.title,
          company: j.companyName,
          companyLogo: j.companyLogo,
          description: j.description || j.excerpt || "",
          location: [...(j.locationRestrictions || []), ...(j.timezoneRestrictions || [])].join(", ") || undefined,
          tags: j.categories,
          jobType: j.employmentType,
          seniority: j.seniority?.[0],
          category: j.categories?.[0],
          salary: j.minSalary || j.maxSalary ? { min: num(j.minSalary), max: num(j.maxSalary), currency: j.currency || "USD", period: "year" } : undefined,
          postedAt: toDate(j.pubDate) ?? new Date(),
          expiresAt: toDate(j.expiryDate),
          raw: j,
        });
      }
    }
    return out;
  },
};
