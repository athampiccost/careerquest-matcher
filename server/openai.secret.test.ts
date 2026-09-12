import { describe, expect, it } from "vitest";

describe("OpenAI server credential", () => {
  const runCredentialProbe = process.env.RUN_OPENAI_CREDENTIAL_TEST === "true" ? it : it.skip;

  runCredentialProbe("authenticates against the models endpoint when explicitly enabled", async () => {
    const apiKey = process.env.OPENAI_API_KEY;
    expect(apiKey).toBeTruthy();

    const response = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(15_000),
    });

    expect(response.ok).toBe(true);
  }, 20_000);
});
