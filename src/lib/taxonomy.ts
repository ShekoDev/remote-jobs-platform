// Central taxonomy. Adding a category, region or skill here is enough:
// the ingest pipeline, filters and UI all read from this file.

export type CategoryDef = {
  slug: string;
  label: string;
  emoji: string;
  /** Sub-category names. Matching is done on job titles; order matters (most specific first). */
  subs: string[];
  /** Extra title keywords that map to this category. */
  keywords?: string[];
};

export const CATEGORIES: CategoryDef[] = [
  {
    slug: "data",
    label: "Data & Analytics",
    emoji: "💻",
    subs: [
      "Data Entry", "Data Analyst", "Data Processing", "Data Annotation", "Data Labeling",
      "Data Quality", "Data Research", "Excel Specialist", "Database Assistant", "Data Coordinator",
      "Data Engineer", "Data Scientist", "Business Intelligence",
    ],
    keywords: ["analytics", "tableau", "power bi", "looker"],
  },
  {
    slug: "admin",
    label: "Administrative",
    emoji: "🗂️",
    subs: [
      "Administrative Assistant", "Virtual Assistant", "Executive Assistant", "Administrative Coordinator",
      "Document Controller", "Back Office", "Operations Assistant", "Office Administrator", "Personal Assistant",
    ],
    keywords: ["admin assistant", "scheduling assistant"],
  },
  {
    slug: "customer_service",
    label: "Customer Service",
    emoji: "📞",
    subs: [
      "Customer Support", "Customer Service Representative", "Chat Support", "Email Support",
      "Call Center", "Client Support", "Customer Success", "Support Specialist",
    ],
    keywords: ["customer service", "customer care", "support agent", "support representative"],
  },
  {
    slug: "sales",
    label: "Sales",
    emoji: "🤝",
    subs: [
      "Sales Development Representative", "Business Development Representative", "Sales Representative",
      "Inside Sales", "Lead Generation", "Appointment Setter", "Sales Assistant", "Account Executive",
    ],
    keywords: ["sdr", "bdr", "account manager", "sales"],
  },
  {
    slug: "marketing",
    label: "Marketing",
    emoji: "📣",
    subs: [
      "Digital Marketing", "Social Media", "SEO", "Content Marketing", "Marketing Assistant",
      "Email Marketing", "Marketing Coordinator", "Growth Marketing", "Performance Marketing",
    ],
    keywords: ["marketing", "ppc", "paid media", "community manager"],
  },
  {
    slug: "finance",
    label: "Finance & Accounting",
    emoji: "📒",
    subs: [
      "Accountant", "Accounting Assistant", "Bookkeeper", "Accounts Payable", "Accounts Receivable",
      "Finance Assistant", "Financial Analyst", "Payroll", "Auditor", "Controller",
    ],
    keywords: ["accounting", "finance", "bookkeeping", "tax"],
  },
  {
    slug: "hr",
    label: "Human Resources",
    emoji: "🧑‍💼",
    subs: [
      "HR Assistant", "HR Coordinator", "Recruiter", "Talent Acquisition", "Recruitment Coordinator",
      "People Operations", "Sourcer", "HR Generalist",
    ],
    keywords: ["human resources", "recruiting", "talent"],
  },
  {
    slug: "it",
    label: "IT & Technology",
    emoji: "🖥️",
    subs: [
      "IT Support", "Help Desk", "Technical Support", "Software Developer", "Web Developer", "QA Tester",
      "Cybersecurity", "Cloud", "DevOps", "Software Engineer", "Frontend Developer", "Backend Developer",
      "Full Stack Developer", "Mobile Developer", "System Administrator", "Site Reliability",
    ],
    keywords: ["engineer", "developer", "programmer", "sre", "security analyst", "network"],
  },
  {
    slug: "design",
    label: "Design & Creative",
    emoji: "🎨",
    subs: [
      "Graphic Designer", "UI/UX Designer", "Product Designer", "Video Editor", "Motion Designer",
      "Illustrator", "Content Creator", "Brand Designer",
    ],
    keywords: ["designer", "ux", "ui", "creative"],
  },
  {
    slug: "writing",
    label: "Writing & Content",
    emoji: "✍️",
    subs: [
      "Content Writer", "Copywriter", "Technical Writer", "Editor", "Proofreader", "Translator",
      "Transcription", "Localization", "Subtitler",
    ],
    keywords: ["writer", "writing", "translation", "transcriptionist"],
  },
  {
    slug: "engineering",
    label: "Engineering",
    emoji: "📐",
    subs: [
      "Civil Engineering", "Mechanical Engineering", "Electrical Engineering", "CAD", "BIM",
      "Quantity Surveying", "Technical Office", "Engineering Coordinator", "Structural Engineer", "Architect",
    ],
    keywords: ["autocad", "revit", "civil", "mechanical", "electrical engineer", "quantity surveyor"],
  },
  {
    slug: "operations",
    label: "Project & Operations",
    emoji: "🧭",
    subs: [
      "Project Coordinator", "Project Manager", "Operations Coordinator", "Operations Manager",
      "Business Operations", "Program Coordinator", "Program Manager", "Scrum Master", "Product Manager",
    ],
    keywords: ["operations", "project", "program", "product owner"],
  },
  {
    slug: "ai",
    label: "AI Jobs",
    emoji: "🤖",
    subs: [
      "AI Trainer", "AI Data Annotator", "AI Evaluator", "AI Content Reviewer", "Machine Learning",
      "Prompt Engineer", "AI Operations", "LLM", "Search Quality Rater", "AI Tutor",
    ],
    keywords: ["artificial intelligence", "ml engineer", "nlp", "computer vision", "generative ai"],
  },
  {
    slug: "management",
    label: "Management",
    emoji: "🏛️",
    subs: ["Head of", "Director", "VP", "Chief", "General Manager", "Team Lead"],
    keywords: [],
  },
  { slug: "other", label: "Other Remote Jobs", emoji: "🌐", subs: [], keywords: [] },
];

export const CATEGORY_BY_SLUG = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c]));

// ---------- Regions ----------

export type RegionDef = {
  code: string;
  label: string;
  flag: string;
  /** Codes implied by this region (a job open to EMEA is open to Egypt). */
  includes?: string[];
  /** Phrases that identify this region in listing text. Lower-case. */
  aliases: string[];
};

export const REGIONS: RegionDef[] = [
  { code: "WORLDWIDE", label: "Worldwide", flag: "🌍", aliases: ["worldwide", "anywhere in the world", "work from anywhere", "global", "any location", "all countries", "any country", "international"] },
  { code: "EG", label: "Egypt", flag: "🇪🇬", aliases: ["egypt", "cairo", "alexandria", "giza"] },
  { code: "SA", label: "Saudi Arabia", flag: "🇸🇦", aliases: ["saudi arabia", "ksa", "riyadh", "jeddah", "saudi"] },
  { code: "AE", label: "UAE", flag: "🇦🇪", aliases: ["uae", "united arab emirates", "dubai", "abu dhabi", "emirates"] },
  { code: "QA", label: "Qatar", flag: "🇶🇦", aliases: ["qatar", "doha"] },
  { code: "KW", label: "Kuwait", flag: "🇰🇼", aliases: ["kuwait"] },
  { code: "BH", label: "Bahrain", flag: "🇧🇭", aliases: ["bahrain", "manama"] },
  { code: "OM", label: "Oman", flag: "🇴🇲", aliases: ["oman", "muscat"] },
  { code: "GB", label: "UK", flag: "🇬🇧", aliases: ["united kingdom", "uk", "england", "london", "scotland", "wales", "great britain"] },
  { code: "US", label: "USA", flag: "🇺🇸", aliases: ["united states", "usa", "u.s.", "us only", "us-based", "u.s.a", "america"] },
  { code: "CA", label: "Canada", flag: "🇨🇦", aliases: ["canada", "toronto", "vancouver"] },
  { code: "AU", label: "Australia", flag: "🇦🇺", aliases: ["australia", "sydney", "melbourne"] },
  { code: "EU", label: "Europe", flag: "🇪🇺", aliases: ["europe", "eu", "european union", "eea", "cet timezone", "european timezones", "germany", "france", "spain", "italy", "netherlands", "poland", "portugal", "ireland", "sweden"] },
  { code: "ASIA", label: "Asia", flag: "🌏", aliases: ["asia", "apac", "india", "philippines", "pakistan", "singapore", "indonesia", "vietnam", "malaysia"] },
  { code: "AFRICA", label: "Africa", flag: "🌍", includes: ["EG"], aliases: ["africa", "nigeria", "kenya", "south africa", "ghana", "morocco"] },
  { code: "MIDDLE_EAST", label: "Middle East", flag: "🕌", includes: ["EG", "SA", "AE", "QA", "KW", "BH", "OM"], aliases: ["middle east", "mena", "gcc", "gulf", "arab world", "arab countries"] },
  { code: "EMEA", label: "EMEA", flag: "🌐", includes: ["EG", "SA", "AE", "QA", "KW", "BH", "OM", "GB", "EU", "AFRICA", "MIDDLE_EAST"], aliases: ["emea"] },
  { code: "LATAM", label: "Latin America", flag: "🌎", aliases: ["latam", "latin america", "south america", "mexico", "brazil", "argentina", "colombia"] },
];

export const REGION_BY_CODE = Object.fromEntries(REGIONS.map((r) => [r.code, r]));

/** Returns true if a job whose eligibleRegions are `regions` is open to `code`. */
export function regionsInclude(regions: string[], code: string): boolean {
  if (regions.includes("WORLDWIDE") || regions.includes(code)) return true;
  return regions.some((r) => REGION_BY_CODE[r]?.includes?.includes(code));
}

// ---------- Skills ----------

export const SKILLS: { name: string; aliases: string[] }[] = [
  { name: "Excel", aliases: ["excel", "ms excel", "microsoft excel", "spreadsheets"] },
  { name: "Google Sheets", aliases: ["google sheets", "gsheets"] },
  { name: "Microsoft Office", aliases: ["microsoft office", "ms office", "office 365", "microsoft 365", "word, excel"] },
  { name: "Data Entry", aliases: ["data entry", "data-entry", "data input"] },
  { name: "CRM", aliases: ["crm", "salesforce", "hubspot", "zoho", "pipedrive"] },
  { name: "Typing", aliases: ["typing", "wpm", "words per minute"] },
  { name: "Customer Service", aliases: ["customer service", "customer support", "client support"] },
  { name: "Communication", aliases: ["communication skills", "communicator", "verbal and written"] },
  { name: "Sales", aliases: ["sales", "cold calling", "outbound", "prospecting"] },
  { name: "Marketing", aliases: ["marketing", "seo", "sem", "google ads", "meta ads"] },
  { name: "SQL", aliases: ["sql", "postgres", "mysql", "postgresql"] },
  { name: "Python", aliases: ["python", "pandas", "django", "fastapi"] },
  { name: "JavaScript", aliases: ["javascript", "typescript", "react", "node.js", "nodejs", "vue", "angular", "next.js"] },
  { name: "WordPress", aliases: ["wordpress", "elementor", "woocommerce"] },
  { name: "Canva", aliases: ["canva"] },
  { name: "Photoshop", aliases: ["photoshop", "adobe creative", "illustrator", "indesign", "figma"] },
  { name: "AutoCAD", aliases: ["autocad", "cad"] },
  { name: "Revit", aliases: ["revit"] },
  { name: "BIM", aliases: ["bim", "navisworks"] },
  { name: "Accounting", aliases: ["accounting", "gaap", "ifrs", "quickbooks", "xero"] },
  { name: "Bookkeeping", aliases: ["bookkeeping", "bookkeeper", "reconciliation"] },
  { name: "AI", aliases: ["artificial intelligence", "machine learning", "llm", " ai ", "ai tools", "ai-powered"] },
  { name: "ChatGPT", aliases: ["chatgpt", "openai", "claude", "gemini"] },
  { name: "Prompt Engineering", aliases: ["prompt engineering", "prompt engineer", "prompting"] },
  { name: "Zendesk", aliases: ["zendesk", "freshdesk", "intercom"] },
  { name: "Notion", aliases: ["notion", "asana", "trello", "clickup", "monday.com"] },
  { name: "Video Editing", aliases: ["premiere", "after effects", "davinci", "video editing", "capcut"] },
  { name: "Java", aliases: ["java ", "spring boot", "kotlin"] },
  { name: "AWS", aliases: ["aws", "azure", "gcp", "google cloud", "kubernetes", "docker", "terraform"] },
];

export const LANGUAGES: { name: string; aliases: string[] }[] = [
  { name: "English", aliases: ["english"] },
  { name: "Arabic", aliases: ["arabic", "اللغة العربية", "العربية"] },
  { name: "French", aliases: ["french", "français"] },
  { name: "German", aliases: ["german", "deutsch"] },
  { name: "Spanish", aliases: ["spanish", "español"] },
  { name: "Italian", aliases: ["italian", "italiano"] },
  { name: "Turkish", aliases: ["turkish", "türkçe"] },
  { name: "Portuguese", aliases: ["portuguese", "português"] },
  { name: "Dutch", aliases: ["dutch"] },
  { name: "Japanese", aliases: ["japanese"] },
];

export const SOURCES_META: { id: string; name: string; homepage: string }[] = [
  { id: "remotive", name: "Remotive", homepage: "https://remotive.com" },
  { id: "remoteok", name: "Remote OK", homepage: "https://remoteok.com" },
  { id: "jobicy", name: "Jobicy", homepage: "https://jobicy.com" },
  { id: "arbeitnow", name: "Arbeitnow", homepage: "https://www.arbeitnow.com" },
  { id: "himalayas", name: "Himalayas", homepage: "https://himalayas.app" },
  { id: "weworkremotely", name: "We Work Remotely", homepage: "https://weworkremotely.com" },
  { id: "workingnomads", name: "Working Nomads", homepage: "https://www.workingnomads.com" },
  { id: "company", name: "Company Career Page", homepage: "" },
];

export const CURRENCIES = ["USD", "EUR", "GBP", "SAR", "AED", "EGP"] as const;

/** Approximate USD conversion, only used for the salary filter/sort normalization. */
export const USD_RATES: Record<string, number> = {
  USD: 1, EUR: 1.09, GBP: 1.28, SAR: 0.2667, AED: 0.2723, EGP: 0.0207, CAD: 0.74, AUD: 0.66, INR: 0.012,
};
