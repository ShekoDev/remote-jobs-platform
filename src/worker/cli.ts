import { ingestAll } from "../lib/ingest/run";
import { verifyBatch } from "../lib/ingest/verify";
import { sendAlerts } from "./alerts";

const cmd = process.argv[2];
(async () => {
  if (cmd === "ingest") console.table(await ingestAll());
  else if (cmd === "verify") console.log(await verifyBatch(Number(process.argv[3]) || undefined));
  else if (cmd === "alerts") await sendAlerts((process.argv[3] as "DAILY") || "DAILY", console.log);
  else console.log("usage: tsx src/worker/cli.ts <ingest|verify [n]|alerts [INSTANT|DAILY|WEEKLY]>");
  process.exit(0);
})();
