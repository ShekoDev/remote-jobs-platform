import { prisma } from "../db";
import { DEFAULT_PROFILE, type Profile } from "../matching";

export async function loadProfile(userKey: string): Promise<Profile> {
  const p = await prisma.userProfile.findUnique({ where: { userKey } });
  if (!p) return DEFAULT_PROFILE;
  return { country: p.country, skills: p.skills, experience: p.experience, languages: p.languages, minHourlyUsd: p.minHourlyUsd, categories: p.categories, education: p.education };
}

export async function loadUserMarks(userKey: string) {
  const [saved, apps] = await Promise.all([
    prisma.savedJob.findMany({ where: { userKey }, select: { jobId: true } }),
    prisma.application.findMany({ where: { userKey }, select: { jobId: true, status: true } }),
  ]);
  return { saved: new Set(saved.map((s) => s.jobId)), tracker: new Map(apps.map((a) => [a.jobId, a.status as string])) };
}
