import { RawListing, SourceAdapter, getJson, toDate, num } from "./types";

type RokJob = {
  id: string; slug: string; url: string; apply_url?: string; position: string; company: string;
  company_logo?: string; location?: string; tags?: string[]; description: string; date: string;
  salary_min?: number; salary_max?: number; epoch?: number;
};

/** Public JSON feed: https://remoteok.com/api (requires a User-Agent; first item is a legal notice). */
export const remoteok: SourceAdapter = {
  id: "remoteok", name: "Remote OK", kind: "api", homepage: "https://remoteok.com",
  async fetch() {
    const data = await getJson<unknown[]>("https://remoteok.com/api");
    return data
      .filter((x): x is RokJob => !!x && typeof x === "object" && "position" in (x as object))
      .map<RawListing>((j) => ({
        sourceId: "remoteok",
        externalId: String(j.id),
        url: j.url,
        applyUrl: j.apply_url,
        title: j.position,
        company: j.company,
        companyLogo: j.company_logo,
        description: j.description,
        location: j.location,
        tags: j.tags,
        salary: j.salary_min || j.salary_max ? { min: num(j.salary_min), max: num(j.salary_max), currency: "USD", period: "year" } : undefined,
        postedAt: toDate(j.epoch) ?? toDate(j.date) ?? new Date(),
        raw: j,
      }));
  },
};
