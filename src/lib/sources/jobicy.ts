import { RawListing, SourceAdapter, getJson, toDate, num } from "./types";

type JobicyJob = {
  id: number; url: string; jobTitle: string; companyName: string; companyLogo?: string;
  jobIndustry?: string[]; jobType?: string[]; jobGeo?: string; jobLevel?: string;
  jobDescription: string; pubDate: string; annualSalaryMin?: number; annualSalaryMax?: number; salaryCurrency?: string;
};

/** Public API: https://jobicy.com/api/v2/remote-jobs (documented, no key). */
export const jobicy: SourceAdapter = {
  id: "jobicy", name: "Jobicy", kind: "api", homepage: "https://jobicy.com",
  async fetch() {
    const data = await getJson<{ jobs: JobicyJob[] }>("https://jobicy.com/api/v2/remote-jobs?count=100");
    return (data.jobs || []).map<RawListing>((j) => ({
      sourceId: "jobicy",
      externalId: String(j.id),
      url: j.url,
      title: j.jobTitle,
      company: j.companyName,
      companyLogo: j.companyLogo,
      description: j.jobDescription,
      location: j.jobGeo,
      tags: j.jobIndustry,
      jobType: j.jobType?.[0],
      seniority: j.jobLevel,
      category: j.jobIndustry?.[0],
      salary: j.annualSalaryMin || j.annualSalaryMax ? { min: num(j.annualSalaryMin), max: num(j.annualSalaryMax), currency: j.salaryCurrency || "USD", period: "year" } : undefined,
      postedAt: toDate(j.pubDate) ?? new Date(),
      raw: j,
    }));
  },
};
