export type SkillPriority = "high" | "medium" | "low";

export type ExperienceProfile = {
  totalYears: number | null;
  domains: string[];
};

export type ExperienceFit = {
  score: number;
  label: "Strong" | "Relevant" | "Developing";
  candidateYears: number | null;
  requiredYears: number | null;
  relevantDomains: string[];
  detail: string;
};

export type JobMatch = {
  id: number;
  role: string;
  company: string;
  postedDate: string | null;
  url: string | null;
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  experienceFit: ExperienceFit;
  certificationSignals: string[];
  rationale: string;
};

export type JobCatalogueItem = {
  id: number;
  role: string;
  company: string;
  description: string;
  postedDate: string | null;
  closingDate: string | null;
  jobType: "job_posting" | "walk_in";
  skills: string[];
  url: string | null;
};

export type JobCatalogueResult = {
  jobs: JobCatalogueItem[];
  total: number;
};

export type SkillGap = {
  skill: string;
  priority: SkillPriority;
  opportunityCount: number;
  description: string;
};

export type ReadinessMetric = {
  label: string;
  value: number;
  detail: string;
};

export type CareerAnalysisResult = {
  profile: {
    source: "Supplied example" | "Uploaded resume";
    detectedSkills: string[];
    experience: ExperienceProfile;
    totalJobs: number;
  };
  topMatches: JobMatch[];
  skillGaps: SkillGap[];
  readiness: ReadinessMetric[];
};

export type CareerInsight = {
  headline: string;
  summary: string;
  learningPriorities: Array<{
    skill: string;
    reason: string;
    nextStep: string;
  }>;
  resumeSuggestions: string[];
  applicationPlan: string[];
  certificationRecommendations: Array<{
    certification: string;
    provider: string;
    targetRoles: string[];
    reason: string;
    firstStep: string;
  }>;
  skillImprovementPlan: Array<{
    phase: string;
    focus: string;
    actions: string[];
    outcome: string;
  }>;
  tutorials: TutorialRecommendation[];
};

export type TutorialRecommendation = {
  id: string;
  title: string;
  topic: string;
  description: string;
  playlistId: string;
};

export type CareerChatTopic = "job_enquiry" | "course_recommendation" | "resume_improvement";

export type CareerChatResponse = {
  answer: string;
  suggestedQuestions: string[];
  tutorials: TutorialRecommendation[];
};
