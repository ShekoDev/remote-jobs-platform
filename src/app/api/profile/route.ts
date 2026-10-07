import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getUserKey } from "@/lib/user";
import { loadProfile } from "@/lib/api/profile";

export const dynamic = "force-dynamic";
const Body = z.object({
  country: z.string().length(2).optional(), skills: z.array(z.string()).optional(),
  experience: z.enum(["NO_EXPERIENCE", "ENTRY", "JUNIOR", "MID", "SENIOR", "LEAD", "MANAGER", "DIRECTOR", "UNKNOWN"]).optional(),
  languages: z.array(z.string()).optional(), minHourlyUsd: z.number().nullable().optional(), categories: z.array(z.string()).optional(),
  education: z.enum(["NO_DEGREE", "HIGH_SCHOOL", "DIPLOMA", "BACHELORS", "MASTERS", "PHD", "UNKNOWN"]).optional(),
});

export async function GET() { return NextResponse.json({ profile: await loadProfile(getUserKey()) }); }
export async function PUT(req: NextRequest) {
  const b = Body.parse(await req.json());
  const userKey = getUserKey();
  const p = await prisma.userProfile.upsert({ where: { userKey }, create: { userKey, ...b }, update: b });
  return NextResponse.json({ profile: p });
}
