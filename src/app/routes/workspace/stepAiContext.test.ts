import { describe, expect, it } from "vitest";
import i18next from "../../../i18n";
import { getCoachingMarkdown } from "./coachContent";
import { buildStepAssistantPrompt } from "./stepAiContext";

describe("buildStepAssistantPrompt", () => {
  it("embeds the step's real coaching content", () => {
    const prompt = buildStepAssistantPrompt(4, "en", i18next.t, "How do I verify a root cause?");

    expect(prompt).toContain(getCoachingMarkdown("en", 4).trim());
  });

  it("embeds the step's own question", () => {
    const prompt = buildStepAssistantPrompt(4, "en", i18next.t, "How do I verify a root cause?");

    expect(prompt).toContain("How do I verify a root cause?");
  });

  it("lists the methods available in that step by their real localized name", () => {
    const prompt = buildStepAssistantPrompt(4, "en", i18next.t, "hi");

    expect(prompt).toContain("Fishbone (Ishikawa)");
    expect(prompt).toContain("5 Why");
  });

  it("switches labels to Turkish when the language is tr", () => {
    const prompt = buildStepAssistantPrompt(4, "tr", i18next.t, "Kök nedeni nasıl doğrularım?");

    expect(prompt).toContain(getCoachingMarkdown("tr", 4).trim());
    expect(prompt).toContain("Bu adımda kullanılabilecek yöntemler");
    expect(prompt).toContain("Kullanıcının sorusu: Kök nedeni nasıl doğrularım?");
  });

  it("produces a longer prompt than the raw question alone", () => {
    const question = "short question";
    const prompt = buildStepAssistantPrompt(2, "en", i18next.t, question);

    expect(prompt.length).toBeGreaterThan(question.length);
  });
});
