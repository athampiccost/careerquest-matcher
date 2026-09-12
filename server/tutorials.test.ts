import { describe, expect, it } from "vitest";
import { getTutorialRecommendations } from "./tutorials";

describe("tutorial recommendations", () => {
  it("maps AI learning priorities to a small set of relevant, embeddable YouTube playlists", () => {
    const tutorials = getTutorialRecommendations({
      learningPriorities: [{ skill: "Azure", reason: "Azure appears in leading cloud roles.", nextStep: "Complete an Azure foundation project." }],
      certificationRecommendations: [{ certification: "Microsoft Certified: Azure Fundamentals", provider: "Microsoft", targetRoles: ["Cloud Engineer"], reason: "It supports the Azure gap.", firstStep: "Review objectives." }],
      skillImprovementPlan: [{ phase: "0–30 days", focus: "Azure basics", actions: ["Complete an Azure lab."], outcome: "A documented starter project." }, { phase: "31–60 days", focus: "Portfolio", actions: ["Publish a project."], outcome: "Visible evidence." }, { phase: "61–90 days", focus: "Applications", actions: ["Tailor applications."], outcome: "Role alignment." }],
    });
    expect(tutorials.length).toBeGreaterThanOrEqual(1);
    expect(tutorials.length).toBeLessThanOrEqual(3);
    expect(tutorials[0]).toMatchObject({ id: "azure", playlistId: "PLlVtbbG169nED0_vMEniWBQjSoxTsBYS3" });
  });
});
