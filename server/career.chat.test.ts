import { describe, expect, it } from "vitest";
import { careerChatInputSchema } from "./routers/career";

describe("career.chat input history", () => {
  it("normalizes a stale long assistant reply before building the chat prompt", () => {
    const result = careerChatInputSchema.parse({
      topic: "course_recommendation",
      question: "Which course should I start this week?",
      history: [{ role: "assistant", content: "A".repeat(2_100) }],
    });

    expect(result.history).toHaveLength(1);
    expect(result.history[0]?.content).toHaveLength(1_600);
  });
});
