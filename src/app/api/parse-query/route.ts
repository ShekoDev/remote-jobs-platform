import { NextRequest, NextResponse } from "next/server";
import { parseQuery } from "@/lib/nlq";

export async function POST(req: NextRequest) {
  const { text } = await req.json();
  return NextResponse.json({ filters: parseQuery(String(text || "")) });
}
