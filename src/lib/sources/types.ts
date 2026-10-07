/**
 * Every source (API, RSS, career page) implements SourceAdapter and returns
 * RawListing objects. The ingest pipeline does all classification, so an
 * adapter's only job is to map the source's fields faithfully — never to
 * invent values. Unknown fields must stay undefined.
 */
export type RawListing = {
  sourceId: string;
  externalId: string;
  url: string;                 // listing page on the source
  applyUrl?: string;           // direct apply link if the source exposes one
  title: string;
  company: string;
  companyLogo?: string;
  companyUrl?: string;
  description: string;         // HTML or text; will be sanitized
  location?: string;           // the source's own location/eligibility string
  tags?: string[];
  jobType?: string;            // source's own employment-type string
  seniority?: string;          // source's own level string
  category?: string;           // source's own category string
  salary?: { min?: number; max?: number; currency?: string; period?: "hour" | "month" | "year"; raw?: string };
  postedAt: Date;
  expiresAt?: Date;
  raw?: unknown;
};

export interface SourceAdapter {
  id: string;
  name: string;
  kind: "api" | "rss" | "career_page";
  homepage: string;
  fetch(): Promise<RawListing[]>;
}

export const UA = "RemoteJobsPlatform/1.0 (+https://example.com; job aggregator; contact admin)";

export async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "user-agent": UA, accept: "application/json", ...(init?.headers || {}) },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return (await res.json()) as T;
}

export function toDate(v: unknown): Date | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  if (typeof v === "number") return new Date(v < 1e12 ? v * 1000 : v);
  const d = new Date(String(v));
  return isNaN(d.getTime()) ? undefined : d;
}

export function num(v: unknown): number | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(/[^0-9.]/g, ""));
  return isNaN(n) || n <= 0 ? undefined : n;
}
