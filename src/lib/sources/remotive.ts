import { RawListing, SourceAdapter, getJson, toDate, num } from "./types";

type RemotiveJob = {
  id: number; url: string; title: string; company_name: string; company_logo?: string;
  category?: string; tags?: string[]; job_type?: string; publication_date: string;
  candidate_required_location?: string; salary?: string; description: string;
};

/** Public API: https://remotive.com/api/remote-jobs (documented, no key). */
export const remotive: SourceAdapter = {
  id: "remotive", name: "Remotive", kind: "api", homepage: "https://remotive.com",
  async fetch() {
    const data = await getJson<{ jobs: RemotiveJob[] }>("https://remotive.com/api/remote-jobs?limit=500");
    return (data.jobs || []).map<RawListing>((j) => ({
      sourceId: "remotive",
      externalId: String(j.id),
      url: j.url,
      title: j.title,
      company: j.company_name,
      companyLogo: j.company_logo,
      description: j.description,
      location: j.candidate_required_location,
      tags: j.tags,
      jobType: j.job_type,
      category: j.category,
      salary: j.salary ? parseSalaryString(j.salary) : undefined,
      postedAt: toDate(j.publication_date) ?? new Date(),
      raw: j,
    }));
  },
};

/** Parses strings like "$40,000 - $60,000", "$25/hour", "€3,000 per month". Returns raw when unsure. */
export function parseSalaryString(raw: string) {
  const s = raw.trim();
  const cur = /€|eur/i.test(s) ? "EUR" : /£|gbp/i.test(s) ? "GBP" : /sar/i.test(s) ? "SAR" : /aed/i.test(s) ? "AED" : /egp/i.test(s) ? "EGP" : /\$|usd/i.test(s) ? "USD" : undefined;
  const nums = (s.match(/\d[\d,]*(?:\.\d+)?\s*k?/gi) || []).map((x) => {
    const k = /k$/i.test(x.trim());
    const n = parseFloat(x.replace(/[^0-9.]/g, ""));
    return k ? n * 1000 : n;
  }).filter((n) => n > 0);
  const period: "hour" | "month" | "year" | undefined = /hour|hr|\/h\b/i.test(s) ? "hour" : /month|mo\b/i.test(s) ? "month" : /year|yr|annum|annual/i.test(s) ? "year" : undefined;
  if (!nums.length) return { raw: s };
  return { min: num(Math.min(...nums)), max: num(Math.max(...nums)), currency: cur, period, raw: s };
}
