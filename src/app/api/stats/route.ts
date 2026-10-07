import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { VISIBLE_WHERE } from "@/lib/query";

export const dynamic = "force-dynamic";

export async function GET() {
  const dayAgo = new Date(Date.now() - 86_400_000);
  const [live, today, egypt, worldwide, entry, sources, lastVerified] = await Promise.all([
    prisma.job.count({ where: VISIBLE_WHERE }),
    prisma.job.count({ where: { ...VISIBLE_WHERE, postedAt: { gte: dayAgo } } }),
    prisma.job.count({ where: { ...VISIBLE_WHERE, egyptEligible: "YES" } }),
    prisma.job.count({ where: { ...VISIBLE_WHERE, eligibleRegions: { has: "WORLDWIDE" } } }),
    prisma.job.count({ where: { ...VISIBLE_WHERE, experience: { in: ["ENTRY", "NO_EXPERIENCE"] } } }),
    prisma.source.findMany({ select: { id: true, name: true, lastRunAt: true, lastRunOk: true, enabled: true } }),
    prisma.job.aggregate({ _max: { lastVerifiedAt: true } }),
  ]);
  return NextResponse.json({ live, today, egypt, worldwide, entry, sources, lastVerifiedAt: lastVerified._max.lastVerifiedAt });
}
