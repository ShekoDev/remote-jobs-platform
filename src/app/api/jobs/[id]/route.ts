import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserKey } from "@/lib/user";
import { loadProfile, loadUserMarks } from "@/lib/api/profile";
import { toDTO } from "@/lib/api/dto";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const job = await prisma.job.findUnique({ where: { id: params.id }, include: { listings: true } });
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  const userKey = getUserKey();
  const [profile, marks] = await Promise.all([loadProfile(userKey), loadUserMarks(userKey)]);
  return NextResponse.json({ job: toDTO(job, profile, marks.saved, marks.tracker, true) });
}
