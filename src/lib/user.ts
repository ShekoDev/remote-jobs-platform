import { cookies } from "next/headers";
import { randomUUID } from "crypto";

export const USER_COOKIE = "rj_user";

/** Anonymous per-browser key used for saved jobs, applications, alerts. Swap for real auth later. */
export function getUserKey(): string {
  const jar = cookies();
  const existing = jar.get(USER_COOKIE)?.value;
  if (existing) return existing;
  const key = randomUUID();
  try { jar.set(USER_COOKIE, key, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 }); } catch { /* read-only context */ }
  return key;
}
