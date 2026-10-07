import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getUserKey } from "@/lib/user";

export const dynamic = "force-dynamic";
const STATUS = ["SAVED", "READY_TO_APPLY", "APPLIED", "ASSESSMENT", "INTERVIEW", "OFFER", "REJECTED"] as const;

export async function GET() {
  const userKey = getUserKey();
  const rows = await prisma.application.findMany({
    where: { userKey }, orderBy: { updatedAt: "desc" },
    include: { job: { select: { id: true, title: true, company: true, companyLogo: true, salaryMin: true, salaryMax: true, salaryCurrency: true, salaryPeriod: true, applyUrl: true, applicationStatus: true } } },
  });
  return NextResponse.json({ applications: rows });
}

const Body = z.object({ jobId: z.string(), status: z.enum(STATUS).optional(), notes: z.string().max(2000).optional(), appliedAt: z.string().datetime().nullable().optional() });

export async function POST(req: NextRequest) {
  const b = Body.parse(await req.json());
  const userKey = getUserKey();
  const appliedAt = b.status === "APPLIED" && b.appliedAt === undefined ? new Date() : b.appliedAt === null ? null : b.appliedAt ? new Date(b.appliedAt) : undefined;
  const row = await prisma.application.upsert({
    where: { userKey_jobId: { userKey, jobId: b.jobId } },
    create: { userKey, jobId: b.jobId, status: b.status ?? "SAVED", notes: b.notes, appliedAt: appliedAt ?? undefined },
    update: { status: b.status, notes: b.notes, appliedAt },
  });
  return NextResponse.json({ application: row });
}

export async function DELETE(req: NextRequest) {
  const { jobId } = await req.json();
  await prisma.application.deleteMany({ where: { userKey: getUserKey(), jobId } });
  return NextResponse.json({ ok: true });
}
