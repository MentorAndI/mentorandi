import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../lib/generated/prisma/client";
import {
  parseSpecialistPacks,
  SPECIALIST_VERSION,
} from "../services/mentor-specialization/specialist-import";

interface ImportCounts {
  created: number;
  unchanged: number;
  updated: number;
}

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("Missing DATABASE_URL.");
  return databaseUrl;
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: getDatabaseUrl() }),
});

async function main() {
  const packs = await parseSpecialistPacks();
  const counts: ImportCounts = { created: 0, unchanged: 0, updated: 0 };

  for (const parsed of packs) {
    await prisma.$transaction(async (tx) => {
      const mentor = await tx.mentor.findUnique({
        select: { id: true },
        where: { slug: parsed.definition.mentorSlug },
      });
      await tx.mentorSpecialistPack.updateMany({
        data: { status: "ARCHIVED" },
        where: {
          mentorSlug: parsed.definition.mentorSlug,
          status: "ACTIVE",
          NOT: { version: SPECIALIST_VERSION },
        },
      });
      const packData = {
        description: parsed.description,
        displayName: parsed.definition.displayName,
        mentorId: mentor?.id ?? null,
        mentorSlug: parsed.definition.mentorSlug,
        sourcePath: parsed.sourcePath,
        status: "ACTIVE" as const,
      };
      const existingPack = await tx.mentorSpecialistPack.findUnique({
        where: {
          slug_version: {
            slug: parsed.definition.slug,
            version: SPECIALIST_VERSION,
          },
        },
      });
      const pack = await tx.mentorSpecialistPack.upsert({
        create: {
          ...packData,
          slug: parsed.definition.slug,
          version: SPECIALIST_VERSION,
        },
        update: packData,
        where: {
          slug_version: {
            slug: parsed.definition.slug,
            version: SPECIALIST_VERSION,
          },
        },
      });
      tally(counts, existingPack, packData);

      for (const item of parsed.techniques) {
        const data = {
          mentorWording: item.mentorWording,
          priority: item.priority,
          sourcePath: item.sourcePath,
          stepsJson: item.steps,
          summary: item.summary,
          tags: item.tags,
          title: item.title,
          version: SPECIALIST_VERSION,
          whenToUse: item.whenToUse,
        };
        const existing = await tx.mentorTechnique.findUnique({
          where: { packId_slug: { packId: pack.id, slug: item.slug } },
        });
        await tx.mentorTechnique.upsert({
          create: { ...data, packId: pack.id, slug: item.slug },
          update: data,
          where: { packId_slug: { packId: pack.id, slug: item.slug } },
        });
        tally(counts, existing, data);
      }

      for (const item of parsed.knowledgeCards) {
        const data = {
          body: item.body,
          priority: item.priority,
          selectionHints: item.selectionHints,
          sourcePath: item.sourcePath,
          sourceRefs: item.sourceRefs,
          summary: item.summary,
          tags: item.tags,
          title: item.title,
          version: SPECIALIST_VERSION,
        };
        const existing = await tx.mentorKnowledgeCard.findUnique({
          where: { packId_slug: { packId: pack.id, slug: item.slug } },
        });
        await tx.mentorKnowledgeCard.upsert({
          create: { ...data, packId: pack.id, slug: item.slug },
          update: data,
          where: { packId_slug: { packId: pack.id, slug: item.slug } },
        });
        tally(counts, existing, data);
      }

      for (const item of parsed.sources) {
        const data = {
          notes: item.notes,
          publisher: item.publisher,
          refreshCadence: item.refreshCadence,
          sourcePath: item.sourcePath,
          sourceType: item.sourceType,
          title: item.title,
          trustLevel: item.trustLevel,
          url: item.url,
          usage: item.usage,
          version: SPECIALIST_VERSION,
        };
        const existing = await tx.mentorSource.findUnique({
          where: { packId_slug: { packId: pack.id, slug: item.slug } },
        });
        await tx.mentorSource.upsert({
          create: { ...data, packId: pack.id, slug: item.slug },
          update: data,
          where: { packId_slug: { packId: pack.id, slug: item.slug } },
        });
        tally(counts, existing, data);
      }

      for (const item of parsed.safetyRules) {
        const data = {
          requiredResponseBehavior: item.requiredResponseBehavior,
          rule: item.rule,
          severity: item.severity,
          sourcePath: item.sourcePath,
          title: item.title,
          triggerPatterns: item.triggerPatterns,
          version: SPECIALIST_VERSION,
        };
        const existing = await tx.mentorSafetyRule.findUnique({
          where: { packId_slug: { packId: pack.id, slug: item.slug } },
        });
        await tx.mentorSafetyRule.upsert({
          create: { ...data, packId: pack.id, slug: item.slug },
          update: data,
          where: { packId_slug: { packId: pack.id, slug: item.slug } },
        });
        tally(counts, existing, data);
      }

      for (const item of parsed.evalScenarios) {
        const data = {
          expectedBehavior: item.expectedBehavior,
          mustAvoid: item.mustAvoid,
          mustUse: item.mustUse,
          safetyExpectation: item.safetyExpectation,
          scenarioType: item.scenarioType,
          sourcePath: item.sourcePath,
          title: item.title,
          userPrompt: item.userPrompt,
          version: SPECIALIST_VERSION,
        };
        const existing = await tx.mentorEvalScenario.findUnique({
          where: { packId_slug: { packId: pack.id, slug: item.slug } },
        });
        await tx.mentorEvalScenario.upsert({
          create: { ...data, packId: pack.id, slug: item.slug },
          update: data,
          where: { packId_slug: { packId: pack.id, slug: item.slug } },
        });
        tally(counts, existing, data);
      }
    }, { timeout: 30_000 });
  }

  console.log(
    `Imported ${packs.length} mentor specialist packs: ${counts.created} created, ${counts.updated} updated, ${counts.unchanged} unchanged.`,
  );
}

function tally(
  counts: ImportCounts,
  existing: Record<string, unknown> | null,
  next: Record<string, unknown>,
) {
  if (!existing) {
    counts.created += 1;
    return;
  }
  const changed = Object.entries(next).some(
    ([key, value]) => JSON.stringify(existing[key]) !== JSON.stringify(value),
  );
  counts[changed ? "updated" : "unchanged"] += 1;
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
