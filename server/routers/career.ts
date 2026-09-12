import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { browseJobCatalogue, buildCareerAnalysis, suppliedExampleAnalysis } from "../matching";
import { extractResumeTextFromPdf } from "../resumePdf";
import { getTutorialRecommendations, getTutorialRecommendationsForText } from "../tutorials";
import type { CareerInsight, JobMatch, SkillGap } from "../../shared/career";
import { publicProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";

export const resumeInputSchema = z.object({
  resumeText: z.string().trim().min(80, "We could not read enough text from this PDF. Please upload a text-based resume PDF.").max(15_000, "Please upload a resume with up to 15,000 characters of extracted text."),
});

export const resumePdfInputSchema = z.object({
  fileName: z.string().trim().min(1).max(200),
  base64: z.string().min(16).max(10_000_000),
});

const jobCatalogueInputSchema = z.object({
  query: z.string().trim().max(100).default(""),
  jobType: z.enum(["all", "job_posting", "walk_in"]).default("all"),
  sortBy: z.enum(["latest", "closing", "company"]).default("latest"),
  limit: z.number().int().min(6).max(60).default(12),
});

const insightRequestSchema = z.object({
  resumeText: z.string().trim().min(80).max(15_000),
  matches: z.array(z.object({
    role: z.string().min(1).max(180),
    company: z.string().min(1).max(180),
    score: z.number().min(0).max(100),
    matchedSkills: z.array(z.string().max(60)).max(20),
    missingSkills: z.array(z.string().max(60)).max(20),
    experienceFit: z.object({
      score: z.number().min(0).max(100),
      label: z.enum(["Strong", "Relevant", "Developing"]),
      candidateYears: z.number().int().min(0).nullable(),
      requiredYears: z.number().int().min(0).nullable(),
      relevantDomains: z.array(z.string().max(80)).max(4),
    }),
    certificationSignals: z.array(z.string().max(100)).max(5),
  })).min(1).max(6),
  skillGaps: z.array(z.object({
    skill: z.string().min(1).max(60),
    priority: z.enum(["high", "medium", "low"]),
    opportunityCount: z.number().int().min(1).max(12),
  })).max(8),
});

const insightSchema = z.object({
  headline: z.string().min(1).max(160),
  summary: z.string().min(1).max(650),
  learningPriorities: z.array(z.object({
    skill: z.string().min(1).max(60),
    reason: z.string().min(1).max(280),
    nextStep: z.string().min(1).max(260),
  })).min(1).max(4),
  resumeSuggestions: z.array(z.string().min(1).max(280)).min(1).max(4),
  applicationPlan: z.array(z.string().min(1).max(220)).min(1).max(4),
  certificationRecommendations: z.array(z.object({
    certification: z.string().min(1).max(120),
    provider: z.string().min(1).max(100),
    targetRoles: z.array(z.string().min(1).max(180)).min(1).max(3),
    reason: z.string().min(1).max(280),
    firstStep: z.string().min(1).max(220),
  })).min(1).max(4),
  skillImprovementPlan: z.array(z.object({
    phase: z.string().min(1).max(60),
    focus: z.string().min(1).max(160),
    actions: z.array(z.string().min(1).max(180)).min(1).max(3),
    outcome: z.string().min(1).max(220),
  })).min(3).max(3),
});

const enrichedInsightSchema = insightSchema.extend({
  tutorials: z.array(z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    topic: z.string().min(1),
    description: z.string().min(1),
    playlistId: z.string().min(1),
  })).max(3),
});

export const careerInsightInputSchema = insightRequestSchema;
export const careerInsightResultSchema = enrichedInsightSchema;

const careerChatTopicSchema = z.enum(["job_enquiry", "course_recommendation", "resume_improvement"]);
const CHAT_HISTORY_CONTENT_LIMIT = 1_600;
const chatHistoryMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  // The client limits messages before sending; this wider input allowance lets
  // the server normalize stale browser history from older releases safely.
  content: z.string().trim().min(1).max(4_000),
});

export const careerChatInputSchema = z.object({
  topic: careerChatTopicSchema,
  question: z.string().trim().min(2, "Please enter a question.").max(600, "Please keep your question under 600 characters."),
  history: z.array(chatHistoryMessageSchema).max(6).default([]).transform(messages => messages.map(message => ({
    ...message,
    content: message.content.slice(0, CHAT_HISTORY_CONTENT_LIMIT).trimEnd(),
  }))),
  context: z.object({
    detectedSkills: z.array(z.string().max(60)).max(30),
    experience: z.object({
      totalYears: z.number().int().min(0).nullable(),
      domains: z.array(z.string().max(80)).max(6),
    }),
    matches: z.array(z.object({
      role: z.string().max(180),
      company: z.string().max(180),
      score: z.number().min(0).max(100),
      matchedSkills: z.array(z.string().max(60)).max(10),
      missingSkills: z.array(z.string().max(60)).max(10),
    })).max(3),
    skillGaps: z.array(z.object({
      skill: z.string().max(60),
      priority: z.enum(["high", "medium", "low"]),
    })).max(5),
  }).optional(),
});

export const careerChatResultSchema = z.object({
  answer: z.string().trim().min(1).max(2_000),
  suggestedQuestions: z.array(z.string().trim().min(1).max(180)).min(1).max(3),
  tutorials: z.array(z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    topic: z.string().min(1),
    description: z.string().min(1),
    playlistId: z.string().min(1),
  })).max(3),
});

function getOutputText(payload: Record<string, unknown>) {
  if (typeof payload.output_text === "string") return payload.output_text;
  const output = Array.isArray(payload.output) ? payload.output : [];
  const pieces: string[] = [];
  output.forEach(item => {
    if (!item || typeof item !== "object") return;
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) return;
    content.forEach(part => {
      if (part && typeof part === "object" && typeof (part as { text?: unknown }).text === "string") {
        pieces.push((part as { text: string }).text);
      }
    });
  });
  return pieces.join("\n");
}

function toPrompt(input: z.infer<typeof insightRequestSchema>) {
  return `Candidate resume excerpt:\n${input.resumeText.slice(0, 12_000)}\n\nTop matching roles:\n${input.matches.map((match, index) => `${index + 1}. ${match.role} at ${match.company} — ${match.score}% match. Evidence: ${match.matchedSkills.join(", ") || "transferable experience"}. Missing: ${match.missingSkills.join(", ") || "none identified"}. Experience fit: ${match.experienceFit.label} (${match.experienceFit.score}%), candidate years: ${match.experienceFit.candidateYears ?? "not detected"}, role threshold: ${match.experienceFit.requiredYears ?? "not stated"}, domains: ${match.experienceFit.relevantDomains.join(", ") || "transferable"}. Certification signals in role: ${match.certificationSignals.join(", ") || "none explicitly listed"}.`).join("\n")}\n\nAggregated skill gaps:\n${input.skillGaps.map(gap => `${gap.skill} (${gap.priority} priority, requested by ${gap.opportunityCount} roles)`).join("; ") || "No aggregate gaps identified."}\n\nCreate exactly three stages in the skill-improvement plan: 0–30 days, 31–60 days, and 61–90 days. Recommend no more than four certifications. Tie each certification to a listed top role or a repeated skill gap. Call a certification "recommended" unless the supplied role explicitly lists it.`;
}

function getChatCompletionText(content: unknown) {
  if (typeof content === "string") return content.trim();
  if (!Array.isArray(content)) return "";
  return content.flatMap(item => item && typeof item === "object" && (item as { type?: unknown }).type === "text" && typeof (item as { text?: unknown }).text === "string" ? [(item as { text: string }).text] : []).join("\n").trim();
}

function chatTopicInstruction(topic: z.infer<typeof careerChatTopicSchema>) {
  if (topic === "job_enquiry") return "Answer the candidate's job-fit question using only the supplied match evidence. Explain fit, gaps, and a focused next action. Do not promise interviews, availability, salary, or hiring outcomes.";
  if (topic === "course_recommendation") return "Recommend a concise, practical learning sequence tied to the supplied skill gaps and experience. Prefer course topics, hands-on projects, and only recommend certifications as optional paths; do not claim a certification is required unless the context says so.";
  return "Recommend concrete résumé improvements using only the supplied skills, experience, matches, and gaps. Do not invent achievements, employers, project metrics, qualifications, or outcomes.";
}

function chatSuggestions(topic: z.infer<typeof careerChatTopicSchema>) {
  if (topic === "job_enquiry") return ["Which top role is the best fit for me?", "What should I improve before applying?", "How can I tailor my profile to my strongest role?"];
  if (topic === "course_recommendation") return ["Which course should I start this week?", "Which certification is most practical for my goals?", "Create a 30-day learning plan for me."];
  return ["Rewrite my professional summary direction.", "Which résumé achievements should I quantify?", "How should I tailor my résumé for my top role?"];
}

function toChatPrompt(input: z.infer<typeof careerChatInputSchema>) {
  const context = input.context
    ? `Candidate context:\nSkills: ${input.context.detectedSkills.join(", ") || "not yet analysed"}.\nExperience: ${input.context.experience.totalYears ? `${input.context.experience.totalYears}+ years` : "years not detected"}; domains: ${input.context.experience.domains.join(", ") || "not identified"}.\nTop matches: ${input.context.matches.map(match => `${match.role} at ${match.company} (${match.score}%): evidence ${match.matchedSkills.join(", ") || "transferable"}; gaps ${match.missingSkills.join(", ") || "none identified"}`).join(" | ") || "No personal match data is available yet."}\nSkill gaps: ${input.context.skillGaps.map(gap => `${gap.skill} (${gap.priority})`).join(", ") || "No recurring gaps identified."}`
    : "No personal résumé analysis is available. Invite the candidate to upload a résumé for personalized guidance.";
  const history = input.history.length ? `Recent conversation:\n${input.history.map(message => `${message.role}: ${message.content}`).join("\n")}` : "No prior conversation.";
  return `${chatTopicInstruction(input.topic)}\n\n${context}\n\n${history}\n\nCandidate question: ${input.question}\n\nRespond in concise Markdown with clear headings or bullets where helpful. Keep the answer under 350 words.`;
}

export const careerRouter = router({
  analyzeExample: publicProcedure.mutation(() => suppliedExampleAnalysis()),

  analyzeResume: publicProcedure.input(resumeInputSchema).mutation(({ input }) => {
    return buildCareerAnalysis(input.resumeText, "Uploaded resume");
  }),

  analyzeResumePdf: publicProcedure.input(resumePdfInputSchema).mutation(async ({ input }) => {
    try {
      const resumeText = await extractResumeTextFromPdf(input.base64);
      return buildCareerAnalysis(resumeText, "Uploaded resume");
    } catch (error) {
      const message = error instanceof Error ? error.message : "We could not read this PDF resume.";
      throw new TRPCError({ code: "BAD_REQUEST", message });
    }
  }),

  browseJobs: publicProcedure.input(jobCatalogueInputSchema).query(({ input }) => {
    return browseJobCatalogue(input);
  }),

  getAIInsights: publicProcedure.input(insightRequestSchema).mutation(async ({ input }) => {
    if (!process.env.OPENAI_API_KEY) {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "AI insights are not configured yet. Please add a server-side OpenAI API key." });
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        input: [
          {
            role: "system",
            content: "You are a precise, encouraging career coach. Base all recommendations only on the supplied resume and job matches. Do not invent qualifications, employers, credentials, salaries, hiring outcomes, or certification requirements. Recommend certifications only when role evidence or a repeated skill gap supports them, and state that they are recommended unless an input role explicitly lists them. Keep recommendations specific, practical, and concise.",
          },
          { role: "user", content: toPrompt(input) },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "career_insight",
            strict: true,
            schema: {
              type: "object",
              properties: {
                headline: { type: "string" },
                summary: { type: "string" },
                learningPriorities: {
                  type: "array", minItems: 1, maxItems: 4,
                  items: {
                    type: "object",
                    properties: { skill: { type: "string" }, reason: { type: "string" }, nextStep: { type: "string" } },
                    required: ["skill", "reason", "nextStep"],
                    additionalProperties: false,
                  },
                },
                resumeSuggestions: { type: "array", minItems: 1, maxItems: 4, items: { type: "string" } },
                applicationPlan: { type: "array", minItems: 1, maxItems: 4, items: { type: "string" } },
                certificationRecommendations: { type: "array", minItems: 1, maxItems: 4, items: { type: "object", properties: { certification: { type: "string" }, provider: { type: "string" }, targetRoles: { type: "array", minItems: 1, maxItems: 3, items: { type: "string" } }, reason: { type: "string" }, firstStep: { type: "string" } }, required: ["certification", "provider", "targetRoles", "reason", "firstStep"], additionalProperties: false } },
                skillImprovementPlan: { type: "array", minItems: 3, maxItems: 3, items: { type: "object", properties: { phase: { type: "string" }, focus: { type: "string" }, actions: { type: "array", minItems: 1, maxItems: 3, items: { type: "string" } }, outcome: { type: "string" } }, required: ["phase", "focus", "actions", "outcome"], additionalProperties: false } },
              },
              required: ["headline", "summary", "learningPriorities", "resumeSuggestions", "applicationPlan", "certificationRecommendations", "skillImprovementPlan"],
              additionalProperties: false,
            },
          },
        },
      }),
      signal: AbortSignal.timeout(35_000),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error("[Career insights] OpenAI request failed", response.status);
      throw new TRPCError({ code: "BAD_GATEWAY", message: "AI insights are temporarily unavailable. Your matching results are still available." });
    }

    try {
      const insight = insightSchema.parse(JSON.parse(getOutputText(payload)));
      return enrichedInsightSchema.parse({ ...insight, tutorials: getTutorialRecommendations(insight) });
    } catch (error) {
      console.error("[Career insights] Invalid structured response", error);
      throw new TRPCError({ code: "BAD_GATEWAY", message: "AI insights returned an unexpected format. Please try again." });
    }
  }),

  chat: publicProcedure.input(careerChatInputSchema).mutation(async ({ input }) => {
    try {
      const completion = await invokeLLM({
        messages: [
          { role: "system", content: "You are CareerQuest, a precise and encouraging career assistant. Follow the requested focus, be transparent about uncertainty, and never invent candidate facts or job outcomes." },
          { role: "user", content: toChatPrompt(input) },
        ],
        maxTokens: 650,
      });
      const answer = getChatCompletionText(completion.choices[0]?.message.content ?? "");
      if (!answer) throw new Error("The assistant returned no text.");
      const boundedAnswer = answer.length > 1_900 ? `${answer.slice(0, 1_897).trimEnd()}…` : answer;
      return careerChatResultSchema.parse({
        answer: boundedAnswer,
        suggestedQuestions: chatSuggestions(input.topic),
        tutorials: input.topic === "course_recommendation" ? getTutorialRecommendationsForText(`${input.question} ${boundedAnswer} ${input.context?.detectedSkills.join(" ") ?? ""} ${input.context?.skillGaps.map(gap => gap.skill).join(" ") ?? ""}`) : [],
      });
    } catch (error) {
      console.error("[Career chat] LLM request failed", error);
      throw new TRPCError({ code: "BAD_GATEWAY", message: "The career assistant is temporarily unavailable. Please try again shortly." });
    }
  }),
});

export type CareerInsightRequest = z.infer<typeof insightRequestSchema>;
export type { CareerInsight, JobMatch, SkillGap };
