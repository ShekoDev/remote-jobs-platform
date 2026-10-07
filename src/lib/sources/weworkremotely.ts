import Parser from "rss-parser";
import { RawListing, SourceAdapter, UA, toDate } from "./types";

/** Public RSS: https://weworkremotely.com/remote-jobs.rss — titles are "Company: Job Title". */
export const weworkremotely: SourceAdapter = {
  id: "weworkremotely", name: "We Work Remotely", kind: "rss", homepage: "https://weworkremotely.com",
  async fetch() {
    const parser = new Parser({ headers: { "user-agent": UA }, customFields: { item: ["region", "category", "type", "company"] } });
    const feed = await parser.parseURL("https://weworkremotely.com/remote-jobs.rss");
    return (feed.items || []).flatMap<RawListing>((it) => {
      const rawTitle = it.title || "";
      const [companyPart, ...rest] = rawTitle.split(":");
      const title = rest.length ? rest.join(":").trim() : rawTitle;
      const company = (it as { company?: string }).company || (rest.length ? companyPart.trim() : "");
      if (!it.link || !title || !company) return [];
      return [{
        sourceId: "weworkremotely",
        externalId: it.guid || it.link,
        url: it.link,
        title,
        company,
        description: (it as { content?: string }).content || it.contentSnippet || "",
        location: (it as { region?: string }).region,
        jobType: (it as { type?: string }).type,
        category: (it as { category?: string }).category,
        postedAt: toDate(it.isoDate || it.pubDate) ?? new Date(),
        raw: it,
      }];
    });
  },
};
