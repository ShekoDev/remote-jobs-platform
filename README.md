<div align="center">

# 🌍 Remote Jobs Platform
### Verified remote jobs aggregator — classified, de-duplicated and re-checked automatically

![Next.js](https://img.shields.io/badge/Next.js_14-000000?logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?logo=prisma&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)

</div>

---


A job-search platform that aggregates **fully remote** jobs from real public sources, classifies each listing (country eligibility, category, level, salary, skills, languages, scam signals), de-duplicates across boards, re-checks that jobs are still open, and presents everything in a filterable dashboard with saved jobs, an application tracker, saved searches and job alerts.

Nothing in this system is fabricated: every job row comes from a source listing, and any field the listing does not state is stored as `UNKNOWN`/`null` and shown as such.

## Stack

- **Next.js 14** (App Router) — UI + JSON API routes
- **PostgreSQL + Prisma** — storage
- **Node worker** (`node-cron`) — ingestion, live verification, alerts
- Tailwind CSS, lucide-react, zod

## Quick start

**Windows:** double-click `start.bat`. It installs dependencies, starts PostgreSQL (Docker if present, otherwise a built-in local server via `npm run db:local` — no installation needed), creates tables, pulls jobs, and opens the site with the worker running.

**Manual / macOS / Linux:**

```bash
cp .env.example .env            # edit DATABASE_URL if needed
docker compose up -d            # local PostgreSQL
npm install
npm run db:push                 # create tables (or db:migrate for migration files)
npm run ingest                  # pull live jobs from all sources once
npm run dev                     # http://localhost:3000
```

In a second terminal, keep data fresh:

```bash
npm run worker                  # ingest every 30 min, re-verify every 2 h, send alerts
```

One-off commands: `npm run ingest`, `npm run verify` (re-checks a batch of open jobs), `npx tsx src/worker/cli.ts alerts DAILY`.

Self-test for the rule engine (uses synthetic fixtures, never touches the DB): `npx tsx tests/classify.test.ts`.

## Sources

| Source | Method | File |
|---|---|---|
| Remotive | public JSON API | `src/lib/sources/remotive.ts` |
| Remote OK | public JSON feed | `src/lib/sources/remoteok.ts` |
| Jobicy | public JSON API | `src/lib/sources/jobicy.ts` |
| Arbeitnow | public JSON API | `src/lib/sources/arbeitnow.ts` |
| Himalayas | public JSON API | `src/lib/sources/himalayas.ts` |
| We Work Remotely | public RSS | `src/lib/sources/weworkremotely.ts` |
| Working Nomads | public JSON feed | `src/lib/sources/workingnomads.ts` |

LinkedIn, Indeed and Glassdoor are **not** included: they offer no public API and forbid scraping. If you obtain an official partner feed, add it as a new adapter (below). Each public source's field names were mapped from its documented feed; if a provider changes its schema, only that adapter file needs an update.

### Adding a source

1. Create `src/lib/sources/<name>.ts` implementing `SourceAdapter` and returning `RawListing[]`. Map fields faithfully — leave anything the source does not provide `undefined`.
2. Append it to `ALL_SOURCES` in `src/lib/sources/index.ts` and to `SOURCES_META` in `src/lib/taxonomy.ts` (for the filter list).

That is the whole change. Classification, dedupe, trust scoring, verification and the UI are source-agnostic.

## How a listing becomes a job (`src/lib/ingest/`)

1. **normalize.ts** — strips HTML and derives:
   - `remoteStatus`: `HYBRID`/`ONSITE` phrases anywhere in the listing win; otherwise explicit remote phrases → `FULLY_REMOTE`; nothing → `UNKNOWN`. Only `FULLY_REMOTE` is ever shown.
   - `eligibleRegions` + `egyptEligible`: from the source's location field and restriction sentences ("must be located in…", "worldwide"). Region groups imply members (EMEA/Middle East/Africa → Egypt). No stated location → `UNKNOWN`, never guessed.
   - category/sub-category (title → taxonomy), experience, employment type, education, salary (normalized to hourly USD for filtering/sorting), skills, languages, Arabic/English required.
2. **scam.ts** — hard flags (application fees, money transfers, crypto pay, WhatsApp/Telegram-only, buying equipment) hide the job; soft signals lower a 0–100 **trust score**; positive signals (official apply link, detailed description, multiple sources, disclosed salary) raise it.
3. **run.ts** — de-duplicates by `fingerprint = normalized company | normalized title`. Multiple listings attach to one `Job`; the official company apply link is always preferred; "Found on N sources" comes from live listings. Jobs older than `JOB_MAX_AGE_DAYS`, past their expiry, or no longer present on any source are marked `CLOSED`.
4. **verify.ts** — periodically fetches each open job's apply URL; 404/410 or "no longer accepting applications" text → `CLOSED`. The card shows "Verified N minutes ago".

## Filters, search and matching

- All filters live in the URL (`src/lib/filters.ts`), so searches are shareable and can be saved or turned into alerts.
- The search bar parses free text into filters client-side (`src/lib/nlq.ts`): "customer service Arabic $15/hour from Egypt no experience" → category, language, hourly minimum, Egypt eligibility, experience.
- **Match score** (`src/lib/matching.ts`) weights location eligibility, remote status, skills, experience, language, salary, category, education and freshness against the user's profile (`/api/profile`; defaults to Egypt, entry level, English + Arabic). Reasons are shown on each card.

## API

| Route | Purpose |
|---|---|
| `GET /api/jobs?…filters` | paged results (`recommended`/`match` sorts re-rank a 600-row window by match score) |
| `GET /api/jobs/:id` | full job incl. description and all source links |
| `GET /api/stats` | dashboard counters + source health |
| `GET/POST/DELETE /api/saved` | saved jobs (saving also creates a tracker row) |
| `GET/POST/DELETE /api/applications` | application tracker |
| `GET/POST/DELETE /api/saved-searches` | saved searches |
| `GET/POST/DELETE /api/alerts` | job alerts (instant / daily / weekly) |
| `GET/PUT /api/profile` | profile used for match scoring |
| `POST /api/parse-query` | server-side version of the search parser |

Users are identified by an anonymous `rj_user` cookie (`src/lib/user.ts`). Swap `getUserKey()` for a real session to add accounts.

## Alerts

`src/worker/alerts.ts` finds new jobs per alert since it last ran and calls `deliver()`. It currently logs to stdout — wire it to Resend, SES, SMTP or push.

## Scaling notes

- Job table is indexed on posted date, category, Egypt eligibility, status and salary; tens of thousands of rows are fine on one Postgres instance.
- When the table grows large, materialize the match score per user segment or move ranking to a search index; `buildWhere()` stays the single place that defines visibility rules.
- Verification is batched (`VERIFY_BATCH_SIZE`) so it can run often without hammering employers' sites.

---

## 👤 Author

**Mahmoud Shahab** — AI Department Manager · AI Automation & Operations
Building AI-powered systems that turn messy operations into clear, trackable workflows.

[![LinkedIn](https://img.shields.io/badge/LinkedIn-mahmoud--shahab--ai-0A66C2?logo=linkedin&logoColor=white)](https://www.linkedin.com/in/mahmoud-shahab-ai)
[![GitHub](https://img.shields.io/badge/GitHub-ShekoDev-181717?logo=github)](https://github.com/ShekoDev)

© Mahmoud Shahab — All rights reserved.
