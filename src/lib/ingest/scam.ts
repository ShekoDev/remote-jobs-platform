import type { NormalizedJob } from "./normalize";

export type TrustResult = { trustScore: number; trustReasons: string[]; scamFlags: string[]; verification: "VERIFIED" | "NEEDS_VERIFICATION" | "SUSPICIOUS" };

/**
 * Hard scam flags remove a job from results entirely. Soft signals only lower
 * the trust score. Reasons are stored so the UI can explain the score.
 */
const HARD_FLAGS: { flag: string; re: RegExp }[] = [
  { flag: "Application fee", re: /(application|registration|processing|training|onboarding|background check) fee|pay (a|the) fee|fee (is|of) \$?\d|refundable deposit/i },
  { flag: "Money transfer request", re: /(western union|moneygram|wire transfer|send (us )?money|transfer funds|cash a check|deposit (a|the) check|reshipping)/i },
  { flag: "Cryptocurrency payment", re: /(paid in (bitcoin|btc|usdt|crypto)|crypto(currency)? (payment|wallet) required|send (btc|usdt))/i },
  { flag: "WhatsApp-only recruitment", re: /(contact|apply|message|reach) (us |me )?(via|on|through|by) whatsapp|whatsapp (only|number)\b|\+\d{1,3}[\s-]?\d{6,}\s*(whatsapp)/i },
  { flag: "Telegram-only recruitment", re: /(contact|apply|message|reach) (us |me )?(via|on|through|by) telegram|telegram (only|@)/i },
  { flag: "Purchase equipment from us", re: /(buy|purchase) (equipment|software|starter kit) from (us|the company)|equipment (deposit|fee)/i },
];

const SOFT_SIGNALS: { reason: string; penalty: number; re: RegExp }[] = [
  { reason: "Vague 'earn $X/day' promise", penalty: 25, re: /(earn|make) (up to )?\$?\d{3,}[\s-]*(per|a|\/)\s*(day|week)|get rich|easy money|no skills needed/i },
  { reason: "Personal email address for applications", penalty: 20, re: /@(gmail|yahoo|hotmail|outlook|aol|protonmail)\.com/i },
  { reason: "Requests personal financial details", penalty: 30, re: /(bank account|routing number|ssn|social security|credit card|id card copy) .{0,40}(before|prior to|to start|to apply)/i },
  { reason: "Very short description", penalty: 15, re: /^[\s\S]{0,180}$/ },
  { reason: "Excessive urgency language", penalty: 10, re: /(urgent(ly)? hiring|immediate start|start today|apply now!!|limited slots)/i },
];

export function assessTrust(job: NormalizedJob, sourceCount: number): TrustResult {
  const text = `${job.title}\n${job.description}\n${job.applyUrl}`;
  const scamFlags = HARD_FLAGS.filter((f) => f.re.test(text)).map((f) => f.flag);
  let score = 70;
  const reasons: string[] = [];

  for (const s of SOFT_SIGNALS) if (s.re.test(job.description)) { score -= s.penalty; reasons.push(s.reason); }

  // Unrealistic salary for the level (soft): > $150/h for entry-level or > $80/h for data entry / admin
  if (job.salaryHourlyUsd) {
    if ((job.experience === "ENTRY" || job.experience === "NO_EXPERIENCE") && job.salaryHourlyUsd > 150) { score -= 30; reasons.push("Salary unrealistic for entry level"); }
    if (["data", "admin", "customer_service"].includes(job.category) && job.subCategory && /data entry|assistant|support/i.test(job.subCategory) && job.salaryHourlyUsd > 80) { score -= 25; reasons.push("Salary unrealistic for the role"); }
  }

  // Suspicious apply URL (shorteners, form builders, messaging links)
  if (/(bit\.ly|tinyurl|t\.me\/|wa\.me\/|forms\.gle|docs\.google\.com\/forms|linktr\.ee)/i.test(job.applyUrl)) { score -= 25; reasons.push("Application link is a shortener or messaging link"); }
  if (!/^https:\/\//.test(job.applyUrl)) { score -= 10; reasons.push("Application link is not HTTPS"); }

  // Positive signals
  if (job.applyUrlIsOfficial) { score += 12; reasons.push("Applies on the company's own site"); }
  if (job.companyLogo) { score += 3; }
  if (job.description.length > 1200) { score += 8; reasons.push("Detailed job description"); }
  if (sourceCount > 1) { score += Math.min(10, sourceCount * 4); reasons.push(`Listed on ${sourceCount} sources`); }
  if (job.salaryHourlyUsd) { score += 4; reasons.push("Salary disclosed"); }
  if (job.remoteStatus === "FULLY_REMOTE" && job.remoteEvidence) { score += 3; }

  score = Math.max(0, Math.min(100, score));
  const verification = scamFlags.length || score < 40 ? "SUSPICIOUS" : score >= 75 ? "VERIFIED" : "NEEDS_VERIFICATION";
  return { trustScore: score, trustReasons: reasons, scamFlags, verification };
}

export function trustLabel(score: number): string {
  if (score >= 90) return "Highly Verified";
  if (score >= 75) return "Verified";
  if (score >= 55) return "Needs Verification";
  if (score >= 40) return "Low Confidence";
  return "Suspicious";
}
