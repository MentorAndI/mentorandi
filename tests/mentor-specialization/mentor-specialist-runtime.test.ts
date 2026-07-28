import assert from "node:assert/strict";

import {
  parseSpecialistPacks,
  specialistPackDefinitions,
} from "../../services/mentor-specialization/specialist-import";
import {
  estimateTokens,
  selectFromPack,
} from "../../services/mentor-specialization/specialist-context.service";

async function run() {
  const packs = await parseSpecialistPacks();
  assert.equal(packs.length, 8, "all eight specialist packs must parse");

  for (const pack of packs) {
    assert.ok(pack.techniques.length >= 8, `${pack.definition.slug} techniques`);
    assert.ok(pack.knowledgeCards.length >= 10, `${pack.definition.slug} cards`);
    assert.ok(pack.sources.length >= 5, `${pack.definition.slug} sources`);
    assert.ok(pack.safetyRules.length > 0, `${pack.definition.slug} safety rules`);
    assert.ok(pack.evalScenarios.length >= 8, `${pack.definition.slug} evals`);
    for (const item of [
      ...pack.techniques,
      ...pack.knowledgeCards,
      ...pack.sources,
      ...pack.safetyRules,
      ...pack.evalScenarios,
    ]) {
      assert.ok(item.sourcePath.startsWith("docs/mentor-specialization/"));
    }
  }

  const executive = packs.find((pack) => pack.definition.slug === "executive-function");
  assert.ok(executive);
  const selected = selectFromPack(
    fixturePack(executive),
    {
      latestUserMessage: "I feel lazy because I cannot start this overwhelming task.",
      mentorSlug: "adhd",
      recentConversationSummary: ["The task is still vague."],
    },
  );
  assert.equal(selected.packSlug, "executive-function");
  assert.ok(selected.techniques.length >= 1 && selected.techniques.length <= 2);
  assert.ok(selected.knowledgeCards.length >= 2 && selected.knowledgeCards.length <= 4);
  assert.match(
    selected.knowledgeCards.map((card) => card.title).join(" "),
    /friction|start|vague|avoidance/i,
  );
  assert.ok(selected.estimatedTokens <= 1_500);
  assert.ok(estimateTokens(selected) <= 1_500);

  const health = packs.find((pack) => pack.definition.slug === "health-fitness");
  assert.ok(health);
  const unsafe = selectFromPack(fixturePack(health), {
    latestUserMessage: "Give me an extreme fasting starvation plan despite my eating disorder.",
    mentorSlug: "health-fitness",
  });
  assert.ok(unsafe.safetyRules.length > 0, "unsafe health request selects safety");
  assert.ok(
    unsafe.safetyRules.some((rule) => rule.severity !== "NORMAL"),
    "unsafe health request selects a high/crisis boundary",
  );

  const providerPayload = JSON.stringify(selected);
  assert.doesNotMatch(providerPayload, /# Executive Function Mentor Techniques v1/);
  assert.doesNotMatch(providerPayload, /docs\/mentor-specialization/);

  assert.deepEqual(
    packs.map((pack) => pack.definition.slug),
    specialistPackDefinitions.map((pack) => pack.slug),
  );
  console.log("Mentor specialist runtime tests passed.");
}

function fixturePack(
  parsed: Awaited<ReturnType<typeof parseSpecialistPacks>>[number],
) {
  return {
    createdAt: new Date(),
    description: parsed.description,
    displayName: parsed.definition.displayName,
    id: crypto.randomUUID(),
    knowledgeCards: parsed.knowledgeCards.map((card) => ({
      ...card,
      createdAt: new Date(),
      id: crypto.randomUUID(),
      packId: "pack",
      updatedAt: new Date(),
      version: "v1",
    })),
    mentorId: null,
    mentorSlug: parsed.definition.mentorSlug,
    safetyRules: parsed.safetyRules.map((rule) => ({
      ...rule,
      createdAt: new Date(),
      id: crypto.randomUUID(),
      packId: "pack",
      updatedAt: new Date(),
      version: "v1",
    })),
    slug: parsed.definition.slug,
    sourcePath: parsed.sourcePath,
    sources: parsed.sources.map((source) => ({
      ...source,
      createdAt: new Date(),
      id: crypto.randomUUID(),
      packId: "pack",
      updatedAt: new Date(),
      version: "v1",
    })),
    status: "ACTIVE" as const,
    techniques: parsed.techniques.map((technique) => ({
      ...technique,
      createdAt: new Date(),
      id: crypto.randomUUID(),
      packId: "pack",
      stepsJson: technique.steps,
      updatedAt: new Date(),
      version: "v1",
    })),
    updatedAt: new Date(),
    version: "v1",
  } as Parameters<typeof selectFromPack>[0];
}

run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
