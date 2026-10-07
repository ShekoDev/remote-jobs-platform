import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserKey } from "@/lib/user";
import { loadProfile, loadUserMarks } from "@/lib/api/profile";
import { toDTO } from "@/lib/api/dto";

export const dynamic = "force-dynamic";

export async function GET() {
  const userKey = getUserKey();
  const [rows, profile, marks] = await Promise.all([
    prisma.savedJob.findMany({ where: { userKey }, orderBy: { createdAt: "desc" }, include: { job: { include: { listings: true } } } }),
    loadProfile(userKey), loadUserMarks(userKey),
  ]);
  return NextResponse.json({ jobs: rows.map((r) => toDTO(r.job, profile, marks.saved, marks.tracker)) });
}

export async function POST(req: NextRequest) {
  const { jobId } = await req.json();
  const userKey = getUserKey();
  await prisma.savedJob.upsert({ where: { userKey_jobId: { userKey, jobId } }, create: { userKey, jobId }, update: {} });
  await prisma.application.upsert({ where: { userKey_jobId: { userKey, jobId } }, create: { userKey, jobId, status: "SAVED" }, update: {} });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { jobId } = await req.json();
  const userKey = getUserKey();
  await prisma.savedJob.deleteMany({ where: { userKey, jobId } });
  return NextResponse.json({ ok: true });
}
