import { prisma } from "../lib/db";
import { FiltersSchema } from "../lib/filters";
import { buildWhere } from "../lib/query";

/**
 * Finds new jobs for each active alert since it was last sent. Delivery is a
 * pluggable function — wire it to Resend, SES, SMTP, or a push service.
 */
export type Deliver = (to: string, subject: string, body: string) => Promise<void>;

const deliver: Deliver = async (to, subject, body) => {
  // Replace with a real transport. Logging keeps the pipeline honest without sending mail.
  console.log(`[alert -> ${to}] ${subject}\n${body}`);
};

export async function sendAlerts(frequency: "INSTANT" | "DAILY" | "WEEKLY", log: (s: string) => void) {
  const alerts = await prisma.jobAlert.findMany({ where: { active: true, frequency } });
  for (const a of alerts) {
    const f = FiltersSchema.safeParse(a.filters);
    if (!f.success) continue;
    const since = a.lastSentAt ?? new Date(Date.now() - 7 * 86_400_000);
    const where = { AND: [buildWhere(f.data), { firstSeenAt: { gt: since } }] };
    const jobs = await prisma.job.findMany({ where, orderBy: { postedAt: "desc" }, take: 25, select: { title: true, company: true, applyUrl: true } });
    if (!jobs.length) continue;
    const body = jobs.map((j) => `• ${j.title} — ${j.company}\n  ${j.applyUrl}`).join("\n");
    await deliver(a.email, `${jobs.length} new remote jobs: ${a.name}`, body);
    await prisma.jobAlert.update({ where: { id: a.id }, data: { lastSentAt: new Date() } });
    log(`Alert "${a.name}" -> ${a.email}: ${jobs.length} jobs`);
  }
}
