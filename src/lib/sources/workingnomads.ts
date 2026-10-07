import { RawListing, SourceAdapter, getJson, toDate } from "./types";

type WnJob = { url: string; title: string; description: string; company_name: string; category_name?: string; tags?: string; location?: string; pub_date: string };

/** Public feed: https://www.workingnomads.com/api/exposed_jobs/ */
export const workingnomads: SourceAdapter = {
  id: "workingnomads", name: "Working Nomads", kind: "api", homepage: "https://www.workingnomads.com",
  async fetch() {
    const data = await getJson<WnJob[]>("https://www.workingnomads.com/api/exposed_jobs/");
    return (data || []).map<RawListing>((j) => ({
      sourceId: "workingnomads",
      externalId: j.url,
      url: j.url,
      title: j.title,
      company: j.company_name,
      description: j.description,
      location: j.location,
      tags: j.tags ? j.tags.split(",").map((t) => t.trim()) : undefined,
      category: j.category_name,
      postedAt: toDate(j.pub_date) ?? new Date(),
      raw: j,
    }));
  },
};
