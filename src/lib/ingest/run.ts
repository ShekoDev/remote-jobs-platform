import { prisma } from "../db";
import { enabledSources } from "../sources";
import type { RawListing, SourceAdapter } from "../sources";
import { normalize } from "./normalize";
import { assessTrust } from "./scam";

export type IngestReport = { source: string; fetched: number; created: number; updated: number; skipped: number; error?: string };

const MAX_AGE_DAYS = Number(process.env.JOB_MAX_AGE_DAYS || 45);

/**
 * Pulls every enabled source, normalizes, de-duplicates by fingerprint and
 * upserts. A listing seen again refreshes lastSeenAt; a job whose listings all
 * disappear from their sources gets marked CLOSED by expireStale().
 */
export async function ingestAll(log: (s: string) => void = console.log): Promise<IngestReport[]> {
  const reports: IngestReport[] = [];
  for (const src of enabledSources()) {
    await prisma.source.upsert({
      where: { id: src.id },
      create: { id: src.id, name: src.name, kind: src.kind, homepage: src.homepage },
      update: { name: src.name, kind: src.kind, homepage: src.homepage },
    });
    const r = await ingestSource(src, log);
    reports.push(r);
    await prisma.source.update({
      where: { id: src.id },
      data: { lastRunAt: new Date(), lastRunOk: !r.error, lastRunNote: r.error ?? `fetched ${r.fetched}, new ${r.created}`, totalIngested: { increment: r.created } },
    });
  }
  const expired = await expireStale();
  log(`Expired ${expired} stale jobs.`);
  return reports;
}

export async function ingestSource(src: SourceAdapter, log: (s: string) => void): Promise<IngestReport> {
  const report: IngestReport = { source: src.id, fetched: 0, created: 0, updated: 0, skipped: 0 };
  let listings: RawListing[] = [];
  try {
    listings = await src.fetch();
  } catch (e) {
    report.error = (e as Error).message;
    log(`[${src.id}] fetch failed: ${report.error}`);
    return report;
  }
  report.fetched = listings.length;
  const cutoff = new Date(Date.now() - MAX_AGE_DAYS * 86_400_000);

  for (const raw of listings) {
    try {
      if (!raw.title || !raw.company || !raw.url) { report.skipped++; continue; }
      if (raw.postedAt < cutoff) { report.skipped++; continue; }
      const n = normalize(raw);

      const existing = await prisma.job.findUnique({ where: { fingerprint: n.fingerprint }, include: { listings: true } });
      const sourceCount = (existing?.listings.length ?? 0) + (existing?.listings.some((l) => l.sourceId === src.id) ? 0 : 1);
      const trust = assessTrust(n, sourceCount);

      // Prefer the official company link whenever any listing exposes one.
      const applyUrl = existing?.applyUrlIsOfficial && !n.applyUrlIsOfficial ? existing.applyUrl : n.applyUrl;
      const applyUrlIsOfficial = existing?.applyUrlIsOfficial || n.applyUrlIsOfficial;

      const data = {
        title: n.title, company: n.company, companyLogo: n.companyLogo ?? existing?.companyLogo, companyUrl: n.companyUrl ?? existing?.companyUrl,
        companyCountry: n.companyCountry ?? existing?.companyCountry,
        description: n.description.length >= (existing?.description.length ?? 0) ? n.description : existing!.description,
        category: n.category, subCategory: n.subCategory,
        remoteStatus: n.remoteStatus, remoteEvidence: n.remoteEvidence,
        eligibleRegions: n.eligibleRegions.length ? n.eligibleRegions : existing?.eligibleRegions ?? [],
        egyptEligible: n.egyptEligible !== "UNKNOWN" ? n.egyptEligible : existing?.egyptEligible ?? "UNKNOWN",
        eligibilityNote: n.eligibilityNote,
        experience: n.experience, employmentType: n.employmentType, education: n.education,
        salaryMin: n.salaryMin ?? existing?.salaryMin, salaryMax: n.salaryMax ?? existing?.salaryMax,
        salaryCurrency: n.salaryCurrency ?? existing?.salaryCurrency, salaryPeriod: n.salaryPeriod ?? existing?.salaryPeriod,
        salaryHourlyUsd: n.salaryHourlyUsd ?? existing?.salaryHourlyUsd,
        skills: Array.from(new Set([...(existing?.skills ?? []), ...n.skills])),
        languages: Array.from(new Set([...(existing?.languages ?? []), ...n.languages])),
        arabicRequired: n.arabicRequired || (existing?.arabicRequired ?? false),
        englishRequired: n.englishRequired || (existing?.englishRequired ?? false),
        postedAt: existing ? new Date(Math.min(existing.postedAt.getTime(), n.postedAt.getTime())) : n.postedAt,
        lastSeenAt: new Date(),
        expiresAt: n.expiresAt ?? existing?.expiresAt,
        trustScore: trust.trustScore, trustReasons: trust.trustReasons, scamFlags: trust.scamFlags, verification: trust.verification,
        applicationStatus: (trust.scamFlags.length ? "CLOSED" : "ACCEPTING") as "CLOSED" | "ACCEPTING",
        closedReason: trust.scamFlags.length ? `Scam signals: ${trust.scamFlags.join(", ")}` : null,
        applyUrl, applyUrlIsOfficial,
      };

      const job = existing
        ? await prisma.job.update({ where: { id: existing.id }, data })
        : await prisma.job.create({ data: { ...data, fingerprint: n.fingerprint } });

      await prisma.jobListing.upsert({
        where: { sourceId_externalId: { sourceId: src.id, externalId: raw.externalId } },
        create: { jobId: job.id, sourceId: src.id, externalId: raw.externalId, url: raw.url, rawTitle: raw.title, rawLocation: raw.location, rawPayload: raw.raw as object | undefined, seenAt: new Date(), isAlive: true },
        update: { jobId: job.id, url: raw.url, rawTitle: raw.title, rawLocation: raw.location, seenAt: new Date(), isAlive: true },
      });
      existing ? report.updated++ : report.created++;
    } catch (e) {
      report.skipped++;
      log(`[${src.id}] skip "${raw.title}": ${(e as Error).message}`);
    }
  }
  log(`[${src.id}] fetched ${report.fetched}, new ${report.created}, updated ${report.updated}, skipped ${report.skipped}`);
  return report;
}

/** Marks listings not seen in 3 consecutive days as dead, and closes jobs with no live listings or past expiry/max age. */
export async function expireStale(): Promise<number> {
  const staleListingCutoff = new Date(Date.now() - 3 * 86_400_000);
  await prisma.jobListing.updateMany({ where: { seenAt: { lt: staleListingCutoff }, isAlive: true }, data: { isAlive: false } });
  const now = new Date();
  const maxAge = new Date(Date.now() - MAX_AGE_DAYS * 86_400_000);
  const res = await prisma.job.updateMany({
    where: {
      applicationStatus: { not: "CLOSED" },
      OR: [
        { expiresAt: { lt: now } },
        { postedAt: { lt: maxAge } },
        { listings: { none: { isAlive: true } } },
      ],
    },
    data: { applicationStatus: "CLOSED", closedReason: "No longer listed on any source or past expiry date" },
  });
  return res.count;
}
