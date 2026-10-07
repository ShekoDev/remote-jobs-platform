/**
 * Lightweight self-test for the rule engine. Run: npx tsx tests/classify.test.ts
 * Fixtures below are synthetic and exist ONLY to test the classifier; they are never written to the database.
 */
import assert from "node:assert/strict";
import { normalize } from "../src/lib/ingest/normalize";
import { assessTrust } from "../src/lib/ingest/scam";
import { parseQuery } from "../src/lib/nlq";
import type { RawListing } from "../src/lib/sources/types";

const base = (o: Partial<RawListing>): RawListing => ({ sourceId: "test", externalId: "1", url: "https://example-board.com/j/1", title: "", company: "Test Co", description: "", postedAt: new Date(), ...o });

// 1. Fully remote, worldwide, entry-level data entry with hourly salary
let j = normalize(base({ title: "Data Entry Specialist", location: "Worldwide", description: "<p>This is a fully remote role. Pay is $15 - $20 per hour. No experience required, we will train you. Must be fluent in English. Excel and Google Sheets required.</p>" }));
assert.equal(j.remoteStatus, "FULLY_REMOTE");
assert.equal(j.egyptEligible, "YES");
assert.deepEqual(j.eligibleRegions, ["WORLDWIDE"]);
assert.equal(j.category, "data"); assert.equal(j.subCategory, "Data Entry");
assert.equal(j.experience, "NO_EXPERIENCE");
assert.equal(j.salaryMin, 15); assert.equal(j.salaryPeriod, "hour"); assert.equal(j.salaryHourlyUsd, 15);
assert.ok(j.skills.includes("Excel") && j.skills.includes("Google Sheets"));
assert.equal(j.englishRequired, true);

// 2. Hybrid is excluded
j = normalize(base({ title: "Customer Support Agent", location: "Remote", description: "Hybrid: 2 days per week in office in Cairo." }));
assert.equal(j.remoteStatus, "HYBRID");

// 3. US-only restriction → not open to Egypt
j = normalize(base({ title: "Senior Accountant", location: "USA only", description: "Remote. Candidates must be located in the United States." }));
assert.equal(j.remoteStatus, "FULLY_REMOTE"); assert.equal(j.egyptEligible, "NO"); assert.equal(j.experience, "SENIOR"); assert.equal(j.category, "finance");

// 4. EMEA → Egypt eligible via region inclusion
j = normalize(base({ title: "Sales Development Representative", location: "EMEA", description: "100% remote position across EMEA timezones. Arabic fluency required." }));
assert.equal(j.egyptEligible, "YES"); assert.equal(j.arabicRequired, true); assert.equal(j.category, "sales");

// 5. No location info → Unknown, never guessed
j = normalize(base({ title: "Virtual Assistant", description: "Work from home. Part-time. Great team." }));
assert.equal(j.egyptEligible, "UNKNOWN"); assert.equal(j.employmentType, "PART_TIME"); assert.equal(j.category, "admin");

// 6. Scam flags
const s = assessTrust(normalize(base({ title: "Data Entry Clerk", location: "Worldwide", description: "Remote. Earn $500 per day. Pay a $50 registration fee to start. Contact us via WhatsApp." })), 1);
assert.ok(s.scamFlags.includes("Application fee")); assert.ok(s.scamFlags.includes("WhatsApp-only recruitment")); assert.equal(s.verification, "SUSPICIOUS");

// 7. Natural-language query
let q = parseQuery("Remote customer service Arabic $15/hour from Egypt no experience");
assert.equal(q.egypt, "YES"); assert.ok(q.categories!.includes("customer_service")); assert.ok(q.languages!.includes("Arabic")); assert.equal(q.hourlyMin, 15); assert.ok(q.experience!.includes("NO_EXPERIENCE"));
q = parseQuery("Remote Excel jobs worldwide posted today");
assert.ok(q.skills!.includes("Excel")); assert.ok(q.regions!.includes("WORLDWIDE")); assert.equal(q.posted, "today");
q = parseQuery("AI jobs");
assert.ok(q.categories!.includes("ai"));

console.log("All classifier and query-parser checks passed.");
