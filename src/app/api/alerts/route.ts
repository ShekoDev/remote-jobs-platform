import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getUserKey } from "@/lib/user";

export const dynamic = "force-dynamic";
const Body = z.object({ email: z.string().email(), name: z.string().min(1).max(80), filters: z.record(z.unknown()), frequency: z.enum(["INSTANT", "DAILY", "WEEKLY"]) });

export async function GET() {
  const rows = await prisma.jobAlert.findMany({ where: { userKey: getUserKey() }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ alerts: rows });
}
export async function POST(req: NextRequest) {
  const b = Body.parse(await req.json());
  const row = await prisma.jobAlert.create({ data: { userKey: getUserKey(), ...b, filters: b.filters as object } });
  return NextResponse.json({ alert: row });
}
export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  await prisma.jobAlert.deleteMany({ where: { id, userKey: getUserKey() } });
  return NextResponse.json({ ok: true });
}
