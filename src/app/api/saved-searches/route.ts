import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserKey } from "@/lib/user";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await prisma.savedSearch.findMany({ where: { userKey: getUserKey() }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ searches: rows });
}
export async function POST(req: NextRequest) {
  const { name, filters } = await req.json();
  const row = await prisma.savedSearch.create({ data: { userKey: getUserKey(), name: String(name).slice(0, 80), filters } });
  return NextResponse.json({ search: row });
}
export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  await prisma.savedSearch.deleteMany({ where: { id, userKey: getUserKey() } });
  return NextResponse.json({ ok: true });
}
