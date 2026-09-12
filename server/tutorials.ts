import type { CareerInsight, TutorialRecommendation } from "../shared/career";

type TutorialSource = TutorialRecommendation & { matchTerms: string[] };

const tutorialSources: TutorialSource[] = [
  { id: "aws-cloud", title: "AWS Cloud Practitioner learning playlist", topic: "AWS & cloud foundations", description: "A structured AWS cloud fundamentals course to support cloud-readiness and certification pathways.", playlistId: "PLt1SIbA8guuvfvUDVLpJepmbnYpOfYCIB", matchTerms: ["aws", "cloud", "cloud practitioner"] },
  { id: "azure", title: "Azure Fundamentals learning playlist", topic: "Azure foundations", description: "A guided Azure fundamentals series aligned with common cloud platform skill gaps.", playlistId: "PLlVtbbG169nED0_vMEniWBQjSoxTsBYS3", matchTerms: ["azure", "az-900", "microsoft certified"] },
  { id: "kubernetes", title: "Kubernetes tutorials playlist", topic: "Kubernetes & container orchestration", description: "A practical Kubernetes learning series covering the core container-orchestration concepts.", playlistId: "PLiMWaCMwGJXnHmccp2xlBENZ1xr4FpjXF", matchTerms: ["kubernetes", "cka", "ckad", "container orchestration"] },
  { id: "docker", title: "Docker tutorials playlist", topic: "Docker & containers", description: "A beginner-to-practical Docker playlist for strengthening container workflow evidence.", playlistId: "PLy7NrYWoggjzfAHlUusx2wuDwfCrmJYcs", matchTerms: ["docker", "containers", "container"] },
  { id: "devops", title: "DevOps learning playlist", topic: "DevOps delivery practices", description: "A foundational DevOps course series across automation, delivery, and operating practices.", playlistId: "PL9ooVrP1hQOE5ZDJJsnEXZ2upwK7aTYiX", matchTerms: ["devops", "ci/cd", "jenkins", "infrastructure automation"] },
  { id: "react", title: "Modern React tutorial playlist", topic: "React development", description: "A practical React learning series for strengthening frontend delivery evidence.", playlistId: "PL4cUxeGkcC9gZD-Tvwfod2gaISzfRiP9d", matchTerms: ["react", "frontend", "front-end"] },
  { id: "python-data", title: "Python data analysis playlist", topic: "Python & data analysis", description: "A focused tutorial sequence for building practical Python and data-analysis capability.", playlistId: "PLBTZqjSKn0Ifkbp1Uzw8tXbM-eHp_bxu0", matchTerms: ["python", "data analysis", "data science", "machine learning"] },
];

export function getTutorialRecommendations(insight: Pick<CareerInsight, "learningPriorities" | "certificationRecommendations" | "skillImprovementPlan">): TutorialRecommendation[] {
  const context = [
    ...insight.learningPriorities.map(item => `${item.skill} ${item.reason} ${item.nextStep}`),
    ...insight.certificationRecommendations.map(item => `${item.certification} ${item.provider} ${item.reason}`),
    ...insight.skillImprovementPlan.map(item => `${item.focus} ${item.actions.join(" ")}`),
  ].join(" ");

  return getTutorialRecommendationsForText(context);
}

export function getTutorialRecommendationsForText(context: string): TutorialRecommendation[] {
  const normalizedContext = context.toLowerCase();

  const ranked = tutorialSources
    .map(source => ({ source, score: source.matchTerms.reduce((score, term) => score + (normalizedContext.includes(term) ? 1 : 0), 0) }))
    .filter(item => item.score > 0)
    .sort((left, right) => right.score - left.score || left.source.title.localeCompare(right.source.title))
    .map(item => ({ id: item.source.id, title: item.source.title, topic: item.source.topic, description: item.source.description, playlistId: item.source.playlistId }));

  return (ranked.length ? ranked : tutorialSources.slice(0, 3)).slice(0, 3);
}
