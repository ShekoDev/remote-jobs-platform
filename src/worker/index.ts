import cron from "node-cron";
import { ingestAll } from "../lib/ingest/run";
import { verifyBatch } from "../lib/ingest/verify";
import { sendAlerts } from "./alerts";

/**
 * Background worker: run with `npm run worker` next to the web app.
 *  - ingest: pulls every enabled source, dedupes, expires stale jobs
 *  - verify: re-checks open jobs in batches (Last Verified on cards)
 *  - alerts: emails users about new matching jobs (pluggable transport)
 */
const log = (s: string) => console.log(`[${new Date().toISOString()}] ${s}`);
let busy = false;
const guard = (name: string, fn: () => Promise<unknown>) => async () => {
  if (busy) return log(`${name}: skipped, previous run still active`);
  busy = true;
  try { await fn(); } catch (e) { log(`${name} failed: ${(e as Error).message}`); } finally { busy = false; }
};

cron.schedule(process.env.INGEST_CRON || "*/30 * * * *", guard("ingest", () => ingestAll(log)));
cron.schedule(process.env.VERIFY_CRON || "0 */2 * * *", guard("verify", () => verifyBatch(undefined, log)));
cron.schedule("0 8 * * *", guard("alerts:daily", () => sendAlerts("DAILY", log)));
cron.schedule("0 8 * * 1", guard("alerts:weekly", () => sendAlerts("WEEKLY", log)));
cron.schedule("*/15 * * * *", guard("alerts:instant", () => sendAlerts("INSTANT", log)));

log("Worker started. Running an initial ingest now…");
guard("ingest", () => ingestAll(log))();
