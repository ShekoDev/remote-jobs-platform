import { SourceAdapter } from "./types";
import { remotive } from "./remotive";
import { remoteok } from "./remoteok";
import { jobicy } from "./jobicy";
import { arbeitnow } from "./arbeitnow";
import { himalayas } from "./himalayas";
import { weworkremotely } from "./weworkremotely";
import { workingnomads } from "./workingnomads";

/**
 * Source registry. To add a source: create an adapter file and append it here.
 * Nothing else in the system needs to change.
 *
 * LinkedIn / Indeed / Glassdoor are intentionally absent: they expose no public
 * API and prohibit scraping. Add them only via an official partner feed.
 */
export const ALL_SOURCES: SourceAdapter[] = [remotive, remoteok, jobicy, arbeitnow, himalayas, weworkremotely, workingnomads];

export function enabledSources(): SourceAdapter[] {
  const env = process.env.ENABLED_SOURCES;
  if (!env) return ALL_SOURCES;
  const ids = new Set(env.split(",").map((s) => s.trim()));
  return ALL_SOURCES.filter((s) => ids.has(s.id));
}

export type { SourceAdapter, RawListing } from "./types";
