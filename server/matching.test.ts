import { describe, expect, it } from "vitest";
import { browseJobCatalogue, buildCareerAnalysis, calculateMatchScore, extractExperienceProfile, extractSkills } from "./matching";
import { careerChatInputSchema, careerChatResultSchema, careerInsightInputSchema, careerInsightResultSchema, resumeInputSchema } from "./routers/career";
import { decodeResumePdf, resumePdfLimits } from "./resumePdf";

describe("career matching", () => {
  const sampleResume = "Experienced DevOps and full-stack engineer using Python, React, Node.js, JavaScript, FastAPI, Docker, Jenkins, Git, CI/CD, AWS, SQL, Agile, leadership, and communication.";

  it("detects canonical skills from a resume", () => {
    expect(extractSkills(sampleResume)).toEqual(expect.arrayContaining(["Python", "React", "Node.js", "Docker", "Jenkins", "CI/CD"]));
  });

  it("returns ranked roles, individual skill gaps, and readiness metrics", () => {
    const analysis = buildCareerAnalysis(sampleResume, "Uploaded resume");

    expect(analysis.profile.detectedSkills.length).toBeGreaterThan(5);
    expect(analysis.topMatches.length).toBeGreaterThan(0);
    expect(analysis.topMatches).toHaveLength(25);
    expect(analysis.topMatches[0]?.score).toBeGreaterThanOrEqual(analysis.topMatches.at(-1)?.score ?? 0);
    expect(analysis.topMatches[0]?.rationale).toBeTruthy();
    expect(analysis.skillGaps.length).toBeGreaterThan(0);
    expect(analysis.readiness).toHaveLength(4);
    expect(analysis.topMatches[0]?.experienceFit.detail).toContain("experience");
  });

  it("extracts relevant experience years and technical domains", () => {
    const profile = extractExperienceProfile("Senior engineer with more than 11 years in DevOps, full-stack development, and data science. Built Python and React products with Docker and CI/CD.");
    expect(profile.totalYears).toBe(11);
    expect(profile.domains).toEqual(expect.arrayContaining(["Platform & DevOps", "Full-stack Engineering", "Data & AI"]));
  });

  it("gives broader matched skill evidence more weight than a small perfect overlap", () => {
    const broadMatch = calculateMatchScore(0.75, 6, 0, 50);
    const narrowPerfectMatch = calculateMatchScore(1, 2, 0, 50);
    expect(broadMatch).toBeGreaterThan(narrowPerfectMatch);
    expect(calculateMatchScore(0.75, 10, 0, 50)).toBeGreaterThan(broadMatch);
  });

  it("exposes a filtered, limited, and typed job catalogue for the unified job explorer", () => {
    const catalogue = browseJobCatalogue({ jobType: "all", sortBy: "latest", limit: 12 });
    expect(catalogue.total).toBeGreaterThanOrEqual(25);
    expect(catalogue.jobs).toHaveLength(12);
    expect(catalogue.jobs.every(job => job.role.length > 0 && job.description.length > 0)).toBe(true);
  });

  it("filters catalogue results by company, position, skill, kind, and date ranges", () => {
    const companyResults = browseJobCatalogue({ company: "Techversant", limit: 60 });
    expect(companyResults.jobs.length).toBeGreaterThan(0);
    expect(companyResults.jobs.every(job => job.company.toLowerCase().includes("techversant"))).toBe(true);

    const positionResults = browseJobCatalogue({ position: "DevOps", skill: "Docker", limit: 60 });
    expect(positionResults.jobs.length).toBeGreaterThan(0);
    expect(positionResults.jobs.every(job => job.role.toLowerCase().includes("devops") && job.skills.some(skill => skill.toLowerCase().includes("docker")))).toBe(true);

    const walkInResults = browseJobCatalogue({ jobType: "walk_in", limit: 60 });
    expect(walkInResults.jobs.every(job => job.jobType === "walk_in")).toBe(true);

    const datedJob = browseJobCatalogue({ limit: 60 }).jobs.find(job => job.postedDate && job.closingDate);
    expect(datedJob).toBeTruthy();
    if (datedJob?.postedDate && datedJob.closingDate) {
      const datedResults = browseJobCatalogue({ openDateFrom: datedJob.postedDate, openDateTo: datedJob.postedDate, closedDateFrom: datedJob.closingDate, closedDateTo: datedJob.closingDate, limit: 60 });
      expect(datedResults.jobs).toContainEqual(datedJob);
    }
  });
});

describe("career analysis input validation", () => {
  it("accepts a sufficient resume text and rejects short documents", () => {
    expect(resumeInputSchema.safeParse({ resumeText: "A".repeat(100) }).success).toBe(true);
    expect(resumeInputSchema.safeParse({ resumeText: "too short" }).success).toBe(false);
  });

  it("limits AI insight payloads to the intended structured data", () => {
    const valid = careerInsightInputSchema.safeParse({
      resumeText: "A".repeat(100),
      matches: [{ role: "DevOps Engineer", company: "Example Co", score: 78, matchedSkills: ["Docker"], missingSkills: ["Kubernetes"], experienceFit: { score: 92, label: "Strong", candidateYears: 8, requiredYears: 5, relevantDomains: ["Platform & DevOps"] }, certificationSignals: ["AWS Cloud Practitioner"] }],
      skillGaps: [{ skill: "Kubernetes", priority: "high", opportunityCount: 3 }],
    });
    expect(valid.success).toBe(true);
  });

  it("requires certifications and three staged skill-improvement phases in AI responses", () => {
    const result = careerInsightResultSchema.safeParse({
      headline: "Focused cloud growth plan",
      summary: "Prioritize the repeated cloud skill gap while applying your established DevOps experience.",
      learningPriorities: [{ skill: "Azure", reason: "It appears in the top roles.", nextStep: "Build one Azure project." }],
      resumeSuggestions: ["Add measurable cloud delivery outcomes."],
      applicationPlan: ["Apply to roles aligned with current evidence."],
      certificationRecommendations: [{ certification: "Microsoft Certified: Azure Fundamentals", provider: "Microsoft", targetRoles: ["Cloud Engineer"], reason: "It supports the Azure skill gap.", firstStep: "Review the official skills outline." }],
      skillImprovementPlan: [
        { phase: "0–30 days", focus: "Azure fundamentals", actions: ["Complete a hands-on lab."], outcome: "Documented foundation project." },
        { phase: "31–60 days", focus: "Portfolio evidence", actions: ["Publish a small deployment."], outcome: "Visible role-aligned work sample." },
        { phase: "61–90 days", focus: "Application refinement", actions: ["Tailor applications to target roles."], outcome: "Stronger experience-to-role narrative." },
      ],
      tutorials: [{ id: "azure", title: "Azure Fundamentals learning playlist", topic: "Azure foundations", description: "A guided Azure fundamentals series.", playlistId: "PLlVtbbG169nED0_vMEniWBQjSoxTsBYS3" }],
    });
    expect(result.success).toBe(true);
  });

  it("accepts bounded chat context and returns course-focused response data", () => {
    const request = careerChatInputSchema.safeParse({
      topic: "course_recommendation",
      question: "Which course should I take for Kubernetes?",
      context: {
        detectedSkills: ["Docker", "AWS"],
        experience: { totalYears: 5, domains: ["Platform & DevOps"] },
        matches: [{ role: "DevOps Engineer", company: "Example Co", score: 84, matchedSkills: ["Docker"], missingSkills: ["Kubernetes"] }],
        skillGaps: [{ skill: "Kubernetes", priority: "high" }],
      },
    });
    expect(request.success).toBe(true);
    expect(careerChatResultSchema.safeParse({
      answer: "## Start with Kubernetes fundamentals\nBuild a small deployment project next.",
      suggestedQuestions: ["Create a 30-day learning plan for me."],
      tutorials: [{ id: "kubernetes", title: "Kubernetes tutorials playlist", topic: "Kubernetes & container orchestration", description: "A practical series.", playlistId: "example-playlist" }],
    }).success).toBe(true);
  });

  it("validates the signature and size of PDFs before server-side text extraction", () => {
    const pdfBase64 = Buffer.from("%PDF-1.7\n", "ascii").toString("base64");
    expect(decodeResumePdf(pdfBase64).toString("ascii")).toContain("%PDF");
    expect(() => decodeResumePdf(Buffer.from("not a PDF", "ascii").toString("base64"))).toThrow("valid PDF");
    expect(resumePdfLimits.maxBytes).toBe(7 * 1024 * 1024);
  });
});
