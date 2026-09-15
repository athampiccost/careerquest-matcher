import rawJobs from "./data/jobs.json";
import type { CareerAnalysisResult, ExperienceFit, ExperienceProfile, JobCatalogueItem, JobCatalogueResult, JobMatch, SkillGap } from "../shared/career";

type RawJob = {
  id: number;
  job_title: string;
  job_description?: string;
  preferred_skills?: string;
  company_name?: string;
  posted_date?: string;
  detail_url?: string;
  status?: string;
  is_walk_in?: boolean | string | number;
  closing_date?: string;
  company_address?: string;
  walk_in_address?: string;
};

type SkillDefinition = { name: string; aliases: string[] };
type RoleAffinity = { domain: string; terms: string[]; skills: string[] };
const skillLibrary: SkillDefinition[] = [
  { name: "Python", aliases: ["python"] }, { name: "JavaScript", aliases: ["javascript", "java script"] }, { name: "TypeScript", aliases: ["typescript", "type script"] }, { name: "React", aliases: ["react", "react.js", "reactjs"] }, { name: "Node.js", aliases: ["node.js", "nodejs", "node js"] }, { name: "FastAPI", aliases: ["fastapi", "fast api"] }, { name: "Java", aliases: ["java"] }, { name: "C#", aliases: ["c#", "csharp"] }, { name: "C++", aliases: ["c++", "cpp"] }, { name: "PHP", aliases: ["php"] }, { name: "Laravel", aliases: ["laravel"] }, { name: "HTML", aliases: ["html", "html5"] }, { name: "CSS", aliases: ["css", "css3"] }, { name: "SQL", aliases: ["sql"] }, { name: "MySQL", aliases: ["mysql"] }, { name: "Oracle", aliases: ["oracle"] }, { name: "MongoDB", aliases: ["mongodb", "mongo db"] }, { name: "Docker", aliases: ["docker"] }, { name: "Kubernetes", aliases: ["kubernetes", "k8s"] }, { name: "Podman", aliases: ["podman"] }, { name: "Jenkins", aliases: ["jenkins"] }, { name: "Git", aliases: ["git", "gitlab", "github", "gerrit"] }, { name: "CI/CD", aliases: ["ci/cd", "ci cd", "continuous integration", "continuous delivery"] }, { name: "AWS", aliases: ["aws", "amazon web services"] }, { name: "Azure", aliases: ["azure"] }, { name: "Linux", aliases: ["linux"] }, { name: "DevOps", aliases: ["devops", "dev ops"] }, { name: "REST APIs", aliases: ["rest api", "restful", "rest api's"] }, { name: "API Integration", aliases: ["api integration", "third-party integrations", "third party integrations"] }, { name: "Data Science", aliases: ["data science", "data scientist"] }, { name: "Machine Learning", aliases: ["machine learning", "ml models"] }, { name: "NLP", aliases: ["nlp", "natural language processing"] }, { name: "LLMs", aliases: ["llm", "large language model", "generative ai", "genai"] }, { name: "RAG", aliases: ["rag", "retrieval augmented generation"] }, { name: "Vector Databases", aliases: ["vector database", "vector databases"] }, { name: "Data Analysis", aliases: ["data analysis", "data analytics"] }, { name: "Agile", aliases: ["agile", "scrum", "sprint"] }, { name: "Jira", aliases: ["jira"] }, { name: "Figma", aliases: ["figma"] }, { name: "Selenium", aliases: ["selenium"] }, { name: "Postman", aliases: ["postman"] }, { name: "Test Automation", aliases: ["test automation", "automated testing", "automation testing"] }, { name: "Manual Testing", aliases: ["manual testing", "test cases", "test plans"] }, { name: "WordPress", aliases: ["wordpress"] }, { name: "Shopify", aliases: ["shopify"] }, { name: "Technical SEO", aliases: ["technical seo", "seo"] }, { name: "Google Ads", aliases: ["google ads", "adwords"] }, { name: "UI/UX", aliases: ["ui/ux", "ux", "user interface", "user experience"] }, { name: "Android", aliases: ["android"] }, { name: "Qt", aliases: ["qt", "qml"] }, { name: "Leadership", aliases: ["leadership", "lead", "mentor", "mentoring"] }, { name: "Communication", aliases: ["communication", "presentation", "stakeholder"] }, { name: "Problem Solving", aliases: ["problem solving", "problem-solving"] }, { name: "Project Management", aliases: ["project management", "project manager"] }, { name: "CRM", aliases: ["crm", "salesforce", "hubspot", "pipedrive"] }, { name: "Sales", aliases: ["sales", "business development", "lead generation"] }, { name: "Recruitment", aliases: ["recruitment", "talent acquisition"] }, { name: "MS Office", aliases: ["ms office", "microsoft office", "google workspace"] },{ name: "data modeling", aliases: ["data modeling"] },{ name: "ADF", aliases: ["ADF"] },{ name: "Microsoft SQL Server", aliases: ["Microsoft SQL Server"] },{ name: "Query optimization", aliases: ["Query optimization"] },{ name: "DBA Activities", aliases: ["DBA Activities"] },{ name: "T-SQL", aliases: ["T-SQL"] },{ name: "Azure data platform", aliases: ["Azure data platform"] },{ name: "AI agents", aliases: ["AI agents"] },{ name: "MCP", aliases: ["MCP","mcp"] },{ name: ".NET", aliases: [".NET",".net"] },{ name: "Databricks", aliases: ["Databricks","databricks"] },{ name: "Terraform", aliases: ["Terraform","terraform"] },{ name: "Ansible", aliases: ["Ansible","ansible"] },{ name: "Cloudformation", aliases: ["Cloudformation","Cloudformation"] },{ name: "Requirement Gathering", aliases: ["Requirement Gathering"] },{ name: "Power BI", aliases: ["Power BI"] },{ name: "Power Apps", aliases: ["Power Apps"] },{ name: "Power Automate", aliases: ["Power Automate"] },{ name: "Agile & Scrum Methodologies", aliases: ["Agile","Agile Methodologies","Agile & Scrum Methodologies","Scrum"] },{ name: "Root Cause Analysis (RCA)", aliases: ["Root Cause Analysis","RCA"] },{ name: "procurement / material management", aliases: ["procurement","material management"] },{ name: "ERP Systems", aliases: ["ERP Systems","ERP"] },{ name: "Microsoft Excel", aliases: ["Microsoft Excel","MS Excel"] },{ name: "Microsoft Word", aliases: ["Microsoft Word","MS Word"] },{ name: "Microsoft Word", aliases: ["Microsoft Word","MS Word"] },{ name: "PowerPoint", aliases: ["PowerPoint","powerPoint"] },{ name: "Hardware Engineering", aliases: ["Hardware Engineering"] },{ name: "Networking", aliases: ["Networking"] }
];
const roleAffinities: RoleAffinity[] = [
  { domain: "Platform & DevOps", terms: ["devops", "platform", "site reliability", "cloud"], skills: ["DevOps", "Docker", "Jenkins", "CI/CD", "AWS", "Linux", "Git"] },
  { domain: "Full-stack Engineering", terms: ["full stack", "frontend", "backend", "software developer", "web developer"], skills: ["React", "Node.js", "JavaScript", "Python", "FastAPI", "REST APIs", "HTML", "CSS"] },
  { domain: "Data & AI", terms: ["data", "ai", "machine learning", "analyst"], skills: ["Python", "Data Science", "Machine Learning", "NLP", "LLMs", "RAG", "Data Analysis"] },
  { domain: "Quality Engineering", terms: ["quality assurance", "qa", "test"], skills: ["Test Automation", "Manual Testing", "Postman", "SQL", "Agile"] },
];

const approvedJobs = (rawJobs as RawJob[]).filter(job => job.status === "APPROVED" && Boolean(job.job_description) && Boolean(job.job_title));

export type JobCatalogueFilters = {
  query?: string;
  jobType?: "all" | "job_posting" | "walk_in";
  sortBy?: "latest" | "closing" | "company";
  limit?: number;
};

function toTimestamp(value: string | null | undefined, fallback: number) {
  if (!value) return fallback;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? fallback : timestamp;
}

function toJobCatalogueItem(job: RawJob): JobCatalogueItem {
  const jobText = `${job.job_description ?? ""}\n${job.preferred_skills ?? ""}`;
  const isWalkIn = job.is_walk_in === true || job.is_walk_in === 1 || String(job.is_walk_in).toLowerCase() === "true" || String(job.is_walk_in) === "1";
  return {
    id: job.id,
    role: job.job_title,
    company: job.company_name || "Company not listed",
    description: (job.job_description ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 280),
    postedDate: job.posted_date || null,
    closingDate: job.closing_date || null,
    jobType: isWalkIn ? "walk_in" : "job_posting",
    skills: extractSkills(jobText).slice(0, 8),
    url: job.detail_url || null,
  };
}

export function browseJobCatalogue(filters: JobCatalogueFilters = {}): JobCatalogueResult {
  const query = filters.query?.trim().toLowerCase() ?? "";
  const jobType = filters.jobType ?? "all";
  const sortBy = filters.sortBy ?? "latest";
  const limit = Math.min(60, Math.max(6, filters.limit ?? 12));
  const filtered = approvedJobs
    .map(toJobCatalogueItem)
    .filter(job => jobType === "all" || job.jobType === jobType)
    .filter(job => !query || `${job.role} ${job.company} ${job.description} ${job.skills.join(" ")}`.toLowerCase().includes(query))
    .sort((left, right) => {
      if (sortBy === "company") return left.company.localeCompare(right.company) || left.role.localeCompare(right.role);
      if (sortBy === "closing") return toTimestamp(left.closingDate, Number.MAX_SAFE_INTEGER) - toTimestamp(right.closingDate, Number.MAX_SAFE_INTEGER);
      return toTimestamp(right.postedDate, 0) - toTimestamp(left.postedDate, 0);
    });
  return { jobs: filtered.slice(0, limit), total: filtered.length };
}

function escapeRegExp(value: string) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function containsAlias(text: string, alias: string) { return new RegExp(`(^|[^a-z0-9])${escapeRegExp(alias.toLowerCase())}($|[^a-z0-9])`, "i").test(text); }

export function extractSkills(text: string) {
  const normalized = text.toLowerCase();
  return skillLibrary.filter(skill => skill.aliases.some(alias => containsAlias(normalized, alias))).map(skill => skill.name);
}

export function extractExperienceProfile(text: string): ExperienceProfile {
  const normalized = text.toLowerCase();
  const yearMatches = Array.from(normalized.matchAll(/(\d+)(?:\s*[-–]\s*(\d+))?\+?\s*(?:years?|yrs?)(?:\s+of)?(?:\s+(?:relevant|professional|hands[- ]on))?\s+(?:experience|in)\b/gi));
  const totalYears = yearMatches.length ? Math.max(...yearMatches.map(match => Number(match[2] ?? match[1]))) : null;
  const skills = new Set(extractSkills(text));
  const domains = roleAffinities
    .filter(affinity => affinity.terms.some(term => normalized.includes(term)) || affinity.skills.filter(skill => skills.has(skill)).length >= 2)
    .map(affinity => affinity.domain);
  return { totalYears, domains };
}

function extractRequiredYears(text: string) {
  const matches = Array.from(text.toLowerCase().matchAll(/(\d+)(?:\s*[-–]\s*(\d+))?\+?\s*(?:years?|yrs?)(?:\s+of)?(?:\s+(?:relevant|professional|hands[- ]on))?\s+(?:experience|in)\b/gi));
  return matches.length ? Math.max(...matches.map(match => Number(match[2] ?? match[1]))) : null;
}

function extractCertificationSignals(text: string) {
  const signals = [
    ...Array.from(text.matchAll(/\b(?:AZ|DP|AI|PL|SC|MS)-\d{3}\b/gi)).map(match => match[0].toUpperCase()),
    ...Array.from(text.matchAll(/\bAWS Certified(?: [A-Za-z]+){1,5}\b/gi)).map(match => match[0]),
    ...Array.from(text.matchAll(/\bAWS Cloud Practitioner\b/gi)).map(match => match[0]),
    ...Array.from(text.matchAll(/\b(?:PMP|CKA|CKAD|ISTQB)\b/gi)).map(match => match[0].toUpperCase()),
    ...Array.from(text.matchAll(/\b(?:Certified ScrumMaster|Scrum Master certification)\b/gi)).map(match => match[0]),
  ];
  return Array.from(new Set(signals)).slice(0, 5);
}

function roleBonus(role: string, resumeSkills: Set<string>) {
  const affinity = roleAffinities.find(item => item.terms.some(term => role.toLowerCase().includes(term)));
  return affinity ? Math.min(12, affinity.skills.filter(skill => resumeSkills.has(skill)).length * 2) : 0;
}

function makeExperienceFit(role: string, candidate: ExperienceProfile, requiredYears: number | null): ExperienceFit {
  const affinity = roleAffinities.find(item => item.terms.some(term => role.toLowerCase().includes(term)));
  const relevantDomains = affinity && candidate.domains.includes(affinity.domain) ? [affinity.domain] : [];
  const yearsScore = candidate.totalYears && requiredYears ? Math.min(100, Math.max(25, Math.round((candidate.totalYears / requiredYears) * 100))) : candidate.totalYears ? 72 : 50;
  const score = Math.min(100, yearsScore + (relevantDomains.length ? 8 : 0));
  const label = score >= 85 ? "Strong" : score >= 65 ? "Relevant" : "Developing";
  const candidateText = candidate.totalYears ? `${candidate.totalYears}+ years of experience detected` : "Experience years not detected";
  const requirementText = requiredYears ? `${requiredYears}+ years of experience requested` : "No explicit experience threshold listed";
  const domainText = relevantDomains.length ? `Direct ${relevantDomains[0]} alignment.` : "Transferable experience alignment.";
  return { score, label, candidateYears: candidate.totalYears, requiredYears, relevantDomains, detail: `${candidateText}; ${requirementText}. ${domainText}` };
}

function createRationale(role: string, matchedSkills: string[], missingSkills: string[], score: number, experienceFit: ExperienceFit) {
  const evidence = matchedSkills.slice(0, 4).join(", ");
  const experienceNote = ` Experience fit: ${experienceFit.detail}`;
  if (missingSkills.length === 0) return `${evidence || "Your documented experience"} closely aligns with this ${role} opportunity, creating a strong evidence-based fit.${experienceNote}`;
  const gapPreview = missingSkills.slice(0, 3).join(", ");
  const gapLabel = missingSkills.length === 1 ? "one focused gap" : `${missingSkills.length} skill gaps`;
  return `${evidence || "Your transferable experience"} supports this role. At ${score}% readiness, address ${gapLabel}, starting with ${gapPreview}.${experienceNote}`;
}

function makeSkillGaps(matches: JobMatch[]): SkillGap[] {
  const gaps = new Map<string, { opportunityCount: number; weightedScore: number }>();
  matches.slice(0, 12).forEach(match => match.missingSkills.forEach(skill => {
    const current = gaps.get(skill) ?? { opportunityCount: 0, weightedScore: 0 };
    current.opportunityCount += 1; current.weightedScore += match.score / 100; gaps.set(skill, current);
  }));
  return Array.from(gaps.entries()).map(([skill, value]) => ({
    skill,
    priority: value.opportunityCount >= 3 || value.weightedScore >= 2.2 ? "high" : value.opportunityCount >= 2 ? "medium" : "low",
    opportunityCount: value.opportunityCount,
    description: `Requested by ${value.opportunityCount} of your strongest matching roles.`,
  } satisfies SkillGap)).sort((left, right) => right.opportunityCount - left.opportunityCount || left.skill.localeCompare(right.skill)).slice(0, 8);
}

export function buildCareerAnalysis(resumeText: string, source: CareerAnalysisResult["profile"]["source"]): CareerAnalysisResult {
  const detectedSkills = extractSkills(resumeText);
  const resumeSkillSet = new Set(detectedSkills);
  const experience = extractExperienceProfile(resumeText);
  const rankedJobs = approvedJobs.map(job => {
    const jobText = `${job.job_description ?? ""}\n${job.preferred_skills ?? ""}`;
    const requiredSkills = extractSkills(jobText);
    const matchedSkills = requiredSkills.filter(skill => resumeSkillSet.has(skill));
    const missingSkills = requiredSkills.filter(skill => !resumeSkillSet.has(skill));
    const coverage = requiredSkills.length ? matchedSkills.length / requiredSkills.length : 0;
    const technicalEvidence = Math.min(12, matchedSkills.length * 2);
    const experienceFit = makeExperienceFit(job.job_title, experience, extractRequiredYears(jobText));
    const score = Math.max(8, Math.min(97, Math.round(10 + coverage * 56 + technicalEvidence + roleBonus(job.job_title, resumeSkillSet) + experienceFit.score * 0.14)));
    return { id: job.id, role: job.job_title, company: job.company_name || "Company not listed", postedDate: job.posted_date || null, url: job.detail_url || null, score, matchedSkills, missingSkills, experienceFit, certificationSignals: extractCertificationSignals(jobText), rationale: createRationale(job.job_title, matchedSkills, missingSkills, score, experienceFit) } satisfies JobMatch;
  }).sort((left, right) => right.score - left.score || right.matchedSkills.length - left.matchedSkills.length || left.role.localeCompare(right.role));

  const topMatches = rankedJobs.slice(0, 50);
  const averageReadiness = topMatches.length ? Math.round(topMatches.reduce((total, match) => total + match.score, 0) / topMatches.length) : 0;
  const coverage = topMatches.length ? Math.round((topMatches.reduce((total, match) => total + match.matchedSkills.length, 0) / Math.max(1, topMatches.reduce((total, match) => total + match.matchedSkills.length + match.missingSkills.length, 0))) * 100) : 0;
  const experienceAlignment = topMatches.length ? Math.round(topMatches.reduce((total, match) => total + match.experienceFit.score, 0) / topMatches.length) : 0;
  return {
    profile: { source, detectedSkills, experience, totalJobs: approvedJobs.length },
    topMatches,
    skillGaps: makeSkillGaps(topMatches),
    readiness: [
      { label: "Market alignment", value: averageReadiness, detail: "Average readiness across your twenty-five best role matches." },
      { label: "Skill coverage", value: coverage, detail: "Recognized requirements supported by your resume evidence." },
      { label: "Career momentum", value: Math.min(100, 28 + detectedSkills.length * 4), detail: "Breadth of skills detected in your uploaded resume." },
      { label: "Experience alignment", value: experienceAlignment, detail: "Relevant experience against the strongest role requirements." },
    ],
  };
}

export const suppliedExampleAnalysis = () => buildCareerAnalysis("Senior engineer with 11 years in DevOps, full-stack development, data science, AWS, Python, React, Node.js, JavaScript, HTML, Java, C++, C#, Docker, Podman, Jenkins, Git, Gerrit, SonarQube, CI/CD, FastAPI, REST APIs, NLP, LLMs, RAG, vector databases, UI/UX, Android, Qt, leadership, communication, project management, problem solving, Agile, SQL, and data analysis.", "Supplied example");
