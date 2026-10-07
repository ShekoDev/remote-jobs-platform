import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { filtersFromSearchParams } from "@/lib/filters";
import { buildWhere, buildOrderBy } from "@/lib/query";
import { getUserKey } from "@/lib/user";
import { loadProfile, loadUserMarks } from "@/lib/api/profile";
import { toDTO } from "@/lib/api/dto";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const f = filtersFromSearchParams(req.nextUrl.searchParams);
  const userKey = getUserKey();
  const where = buildWhere(f);
  const rerank = f.sort === "recommended" || f.sort === "match";

  const [total, profile, marks] = await Promise.all([prisma.job.count({ where }), loadProfile(userKey), loadUserMarks(userKey)]);

  let jobs;
  if (rerank) {
    // Score a bounded window, then page inside it. Cheap enough for tens of thousands of rows;
    // swap for a materialized score column when the table grows past that.
    const window = await prisma.job.findMany({ where, orderBy: buildOrderBy(f.sort), take: 600, include: { listings: true } });
    const scored = window.map((j) => toDTO(j, profile, marks.saved, marks.tracker)).sort((a, b) => b.matchScore - a.matchScore || +new Date(b.postedAt) - +new Date(a.postedAt));
    jobs = scored.slice((f.page - 1) * f.pageSize, f.page * f.pageSize);
  } else {
    const rows = await prisma.job.findMany({ where, orderBy: buildOrderBy(f.sort), skip: (f.page - 1) * f.pageSize, take: f.pageSize, include: { listings: true } });
    jobs = rows.map((j) => toDTO(j, profile, marks.saved, marks.tracker));
  }
  return NextResponse.json({ jobs, total, page: f.page, pageSize: f.pageSize, filters: f });
}
