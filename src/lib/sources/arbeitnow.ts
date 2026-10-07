import { RawListing, SourceAdapter, getJson, toDate } from "./types";

type ArbeitnowJob = {
  slug: string; company_name: string; title: string; description: string; remote: boolean;
  url: string; tags?: string[]; job_types?: string[]; location?: string; created_at: number;
};

/** Public API: https://www.arbeitnow.com/api/job-board-api (paginated, no key). */
export const arbeitnow: SourceAdapter = {
  id: "arbeitnow", name: "Arbeitnow", kind: "api", homepage: "https://www.arbeitnow.com",
  async fetch() {
    const out: RawListing[] = [];
    let url: string | null = "https://www.arbeitnow.com/api/job-board-api";
    for (let page = 0; url && page < 5; page++) {
      const data: { data: ArbeitnowJob[]; links?: { next?: string | null } } = await getJson(url);
      for (const j of data.data || []) {
        if (!j.remote) continue; // the source flags remote explicitly; skip non-remote at the door
        out.push({
          sourceId: "arbeitnow",
          externalId: j.slug,
          url: j.url,
          title: j.title,
          company: j.company_name,
          description: j.description,
          location: j.location,
          tags: j.tags,
          jobType: j.job_types?.[0],
          postedAt: toDate(j.created_at) ?? new Date(),
          raw: j,
        });
      }
      url = data.links?.next ?? null;
    }
    return out;
  },
};
