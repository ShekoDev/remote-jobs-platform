import type { Job, JobListing } from "@prisma/client";
import { matchScore, type Profile } from "../matching";
import { trustLabel } from "../ingest/scam";

export type JobDTO = {
  id: string; title: string; company: string; companyLogo: string | null; category: string; subCategory: string | null;
  remoteStatus: string; eligibleRegions: string[]; egyptEligible: string; eligibilityNote: string | null;
  experience: string; employmentType: string; education: string;
  salaryMin: number | null; salaryMax: number | null; salaryCurrency: string | null; salaryPeriod: string | null; salaryHourlyUsd: number | null;
  skills: string[]; languages: string[]; arabicRequired: boolean; englishRequired: boolean;
  postedAt: string; lastVerifiedAt: string | null; verification: string; applicationStatus: string;
  trustScore: number; trustLabel: string; trustReasons: string[];
  applyUrl: string; applyUrlIsOfficial: boolean;
  sources: { id: string; url: string }[]; sourceCount: number;
  matchScore: number; matchReasons: string[];
  saved: boolean; trackerStatus: string | null;
  description?: string;
};

export function toDTO(job: Job & { listings: JobListing[] }, profile: Profile, saved: Set<string>, tracker: Map<string, string>, withDescription = false): JobDTO {
  const m = matchScore(job, profile);
  const live = job.listings.filter((l) => l.isAlive);
  return {
    id: job.id, title: job.title, company: job.company, companyLogo: job.companyLogo, category: job.category, subCategory: job.subCategory,
    remoteStatus: job.remoteStatus, eligibleRegions: job.eligibleRegions, egyptEligible: job.egyptEligible, eligibilityNote: job.eligibilityNote,
    experience: job.experience, employmentType: job.employmentType, education: job.education,
    salaryMin: job.salaryMin, salaryMax: job.salaryMax, salaryCurrency: job.salaryCurrency, salaryPeriod: job.salaryPeriod, salaryHourlyUsd: job.salaryHourlyUsd,
    skills: job.skills, languages: job.languages, arabicRequired: job.arabicRequired, englishRequired: job.englishRequired,
    postedAt: job.postedAt.toISOString(), lastVerifiedAt: job.lastVerifiedAt?.toISOString() ?? null, verification: job.verification, applicationStatus: job.applicationStatus,
    trustScore: job.trustScore, trustLabel: trustLabel(job.trustScore), trustReasons: job.trustReasons,
    applyUrl: job.applyUrl, applyUrlIsOfficial: job.applyUrlIsOfficial,
    sources: live.map((l) => ({ id: l.sourceId, url: l.url })), sourceCount: live.length,
    matchScore: m.score, matchReasons: m.reasons,
    saved: saved.has(job.id), trackerStatus: tracker.get(job.id) ?? null,
    description: withDescription ? job.description : undefined,
  };
}
