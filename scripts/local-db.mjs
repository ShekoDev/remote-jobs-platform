// Runs a local PostgreSQL server with no installation (binaries come from npm).
// Used by start.bat when Docker is not available. Data lives in ./data/db.
import EmbeddedPostgres from "embedded-postgres";
import { existsSync } from "node:fs";
import path from "node:path";

const dir = path.resolve("data/db");
const pg = new EmbeddedPostgres({
  databaseDir: dir,
  user: "remote",
  password: "remote",
  port: 5432,
  persistent: true,
  onLog: () => {},
  onError: (e) => console.error(String(e)),
});

const fresh = !existsSync(path.join(dir, "PG_VERSION"));
if (fresh) { console.log("Initialising local PostgreSQL data directory..."); await pg.initialise(); }
await pg.start();
if (fresh) await pg.createDatabase("remote_jobs");
console.log("Local PostgreSQL running on localhost:5432 (database: remote_jobs). Keep this window open.");
setInterval(() => {}, 1 << 30);
const bye = async () => { await pg.stop(); process.exit(0); };
process.on("SIGINT", bye); process.on("SIGTERM", bye);
