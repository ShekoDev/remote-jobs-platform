import { CATEGORIES, REGIONS, SKILLS, LANGUAGES } from "./taxonomy";
import type { Filters } from "./filters";

/**
 * Turns free text like "Remote customer service Arabic $15/hour no experience
 * from Egypt" into structured filters. Whatever cannot be mapped stays in `q`
 * as a keyword search. Pure rules, no model call, so it works offline.
 */
export function parseQuery(input: string): Partial<Filters> {
  let text = ` ${input.toLowerCase().trim()} `;
  const out: Partial<Filters> = { regions: [], categories: [], experience: [], employment: [], skills: [], languages: [] };
  const eat = (re: RegExp) => { const m = text.match(re); if (m) text = text.replace(m[0], " "); return m; };

  // "from egypt", "in egypt", "egypt eligible"
  if (eat(/\b(from|in|for) egypt\b|\begypt(ian)?[- ]?(eligible|based)?\b|\bمصر\b/)) out.egypt = "YES";
  for (const r of REGIONS) {
    if (r.code === "EG") continue;
    for (const a of r.aliases) if (eat(new RegExp(`\\b(from |in |for )?${a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`))) { out.regions!.push(r.code); break; }
  }
  if (eat(/\b(worldwide|anywhere|work from anywhere|global)\b/)) out.regions!.push("WORLDWIDE");

  // Experience
  if (eat(/\bno experience\b|\bwithout experience\b|\bbeginner\b|\bfresher\b/)) out.experience!.push("NO_EXPERIENCE", "ENTRY");
  if (eat(/\bentry[- ]level\b|\bfresh graduate\b/)) out.experience!.push("ENTRY");
  if (eat(/\bjunior\b/)) out.experience!.push("JUNIOR");
  if (eat(/\bmid[- ]level\b/)) out.experience!.push("MID");
  if (eat(/\bsenior\b/)) out.experience!.push("SENIOR");
  if (eat(/\bmanager\b/)) out.experience!.push("MANAGER");
  if (eat(/\bdirector\b/)) out.experience!.push("DIRECTOR");

  // Employment
  if (eat(/\bpart[- ]time\b/)) out.employment!.push("PART_TIME");
  if (eat(/\bfull[- ]time\b/)) out.employment!.push("FULL_TIME");
  if (eat(/\bfreelance\b/)) out.employment!.push("FREELANCE");
  if (eat(/\bcontract\b/)) out.employment!.push("CONTRACT");
  if (eat(/\binternship\b|\bintern\b/)) out.employment!.push("INTERNSHIP");

  // Salary: "$15/hour", "$15+ per hour", "15 dollars an hour", "$3000/month"
  const sal = eat(/\$\s?(\d+(?:,\d{3})*(?:\.\d+)?)\s?k?\s?\+?\s?(?:\/|per|an|a)?\s?(hour|hr|h|month|mo|year|yr)?\b/);
  if (sal) {
    const n = parseFloat(sal[1].replace(/,/g, "")) * (/k/.test(sal[0]) ? 1000 : 1);
    const period = sal[2] || "";
    if (/^(h|hr|hour)$/.test(period) || (!period && n < 200)) out.hourlyMin = n;
    else if (/^(mo|month)$/.test(period)) out.hourlyMin = Math.round(n / 173);
    else if (/^(yr|year)$/.test(period) || n > 15000) out.hourlyMin = Math.round(n / 2080);
  }
  if (eat(/\bhigh (salary|paying|pay)\b|\bwell[- ]paid\b/)) out.hourlyMin = Math.max(out.hourlyMin || 0, 30);

  // Posted
  if (eat(/\b(today|posted today|new today)\b/)) out.posted = "today";
  else if (eat(/\blast 24 hours\b|\bpast day\b/)) out.posted = "24h";
  else if (eat(/\bthis week\b|\blast 7 days\b/)) out.posted = "7d";
  else if (eat(/\bthis month\b|\blast 30 days\b/)) out.posted = "30d";

  // Languages
  for (const l of LANGUAGES) if (eat(new RegExp(`\\b${l.name.toLowerCase()}( speaking| speaker| required)?\\b`))) {
    out.languages!.push(l.name);
    if (l.name === "Arabic") out.arabicRequired = "YES";
  }

  // Education
  if (eat(/\bno degree\b|\bwithout (a )?degree\b/)) out.education = ["NO_DEGREE"];

  // Categories via sub-category names then labels/keywords
  for (const c of CATEGORIES) {
    const names = [...c.subs.map((s) => s.toLowerCase()), c.label.toLowerCase().replace(/ & .*$/, ""), ...(c.keywords || [])].sort((a, b) => b.length - a.length);
    for (const n of names) if (n.length >= 3 && eat(new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}( jobs?)?\\b`))) {
      out.categories!.push(c.slug);
      const skill = SKILLS.find((s) => s.name.toLowerCase() === n || s.aliases.includes(n));
      if (skill) out.skills!.push(skill.name);
      break;
    }
  }
  if (eat(/\bdata jobs?\b/)) out.categories!.push("data");
  if (eat(/\bai jobs?\b/)) out.categories!.push("ai");

  // Skills (longest alias first to avoid "ai" eating "ai trainer" etc.)
  for (const s of SKILLS) {
    const aliases = [...s.aliases].sort((a, b) => b.length - a.length);
    for (const a of aliases) { const t = a.trim(); if (t.length < 3) continue; if (eat(new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`))) { out.skills!.push(s.name); break; } }
  }

  // noise words
  text = text.replace(/\b(remote|remotely|jobs?|job|work|from home|wfh|hiring|position|positions|vacanc(y|ies)|opening|openings|find|search|me|a|an|the|for|with|and|or|of|in|at|to)\b/g, " ");
  out.q = text.replace(/[^a-z0-9\u0600-\u06FF ]/g, " ").replace(/\s+/g, " ").trim();

  // dedupe
  for (const k of ["regions", "categories", "experience", "employment", "skills", "languages"] as const) out[k] = Array.from(new Set(out[k]));
  return out;
}
