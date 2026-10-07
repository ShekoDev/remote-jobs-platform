import { prisma } from "../db";
import { UA } from "../sources/types";

/**
 * Live verification: re-fetches the apply/listing URL of open jobs and marks
 * them CLOSED when the page is gone or says the position is filled. Runs in
 * small batches so it can be scheduled frequently.
 */
const CLOSED_PATTERNS = /(no longer accepting applications|this (job|position|role) (has been|is) (closed|filled|expired|removed)|position (has been )?filled|job (has )?expired|this posting is no longer available|this job is no longer available|applications (are )?closed|we are no longer hiring|404 not found|page not found)/i;

export async function verifyBatch(limit = Number(process.env.VERIFY_BATCH_SIZE || 200), log: (s: string) => void = console.log) {
  const jobs = await prisma.job.findMany({
    where: { applicationStatus: { not: "CLOSED" } },
    orderBy: [{ lastVerifiedAt: { sort: "asc", nulls: "first" } }],
    take: limit,
    select: { id: true, applyUrl: true, title: true, listings: { where: { isAlive: true }, select: { url: true } } },
  });
  let closed = 0;
  for (const job of jobs) {
    const result = await checkUrl(job.applyUrl);
    // if the official link is dead but a board listing is still alive, keep it but note it
    const status = result.status === "CLOSED" && job.listings.length && (await checkUrl(job.listings[0].url)).status === "ACCEPTING" ? "UNKNOWN" : result.status;
    await prisma.$transaction([
      prisma.job.update({
        where: { id: job.id },
        data: {
          lastVerifiedAt: new Date(),
          applicationStatus: status,
          closedReason: status === "CLOSED" ? result.note : null,
          verification: status === "ACCEPTING" ? undefined : status === "CLOSED" ? "NEEDS_VERIFICATION" : undefined,
        },
      }),
      prisma.verificationLog.create({ data: { jobId: job.id, result: status, httpStatus: result.http, note: result.note } }),
    ]);
    if (status === "CLOSED") closed++;
  }
  log(`Verified ${jobs.length} jobs, closed ${closed}.`);
  return { checked: jobs.length, closed };
}

export async function checkUrl(url: string): Promise<{ status: "ACCEPTING" | "CLOSED" | "UNKNOWN"; http?: number; note?: string }> {
  try {
    const res = await fetch(url, { headers: { "user-agent": UA, accept: "text/html" }, redirect: "follow", signal: AbortSignal.timeout(20_000) });
    if (res.status === 404 || res.status === 410) return { status: "CLOSED", http: res.status, note: `Page returned HTTP ${res.status}` };
    if (res.status >= 500 || res.status === 403 || res.status === 429) return { status: "UNKNOWN", http: res.status, note: `Could not verify (HTTP ${res.status})` };
    const html = (await res.text()).slice(0, 400_000);
    const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ");
    const m = text.match(CLOSED_PATTERNS);
    if (m) return { status: "CLOSED", http: res.status, note: `Page says: "${m[0]}"` };
    return { status: "ACCEPTING", http: res.status };
  } catch (e) {
    return { status: "UNKNOWN", note: `Network error: ${(e as Error).message}` };
  }
}
