import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../lib/generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("Missing DATABASE_URL.");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

async function main() {
  const requestedPack = process.argv.find((argument) => argument.startsWith("--pack="))?.slice(7);
  const packs = await prisma.mentorSpecialistPack.findMany({
    include: { evalScenarios: { orderBy: [{ scenarioType: "asc" }, { title: "asc" }] } },
    orderBy: { slug: "asc" },
    where: {
      status: "ACTIVE",
      ...(requestedPack ? { slug: requestedPack } : {}),
    },
  });
  if (packs.length === 0) {
    throw new Error("No active specialist eval scenarios found. Run the specialist import first.");
  }

  for (const pack of packs) {
    console.log(`\n${pack.displayName} ${pack.version} — ${pack.evalScenarios.length} scenarios`);
    for (const scenario of pack.evalScenarios) {
      console.log(
        JSON.stringify({
          expectedBehavior: scenario.expectedBehavior,
          mustAvoid: scenario.mustAvoid,
          mustUse: scenario.mustUse,
          pack: pack.slug,
          scenario: scenario.slug,
          scenarioType: scenario.scenarioType,
          userPrompt: scenario.userPrompt,
        }),
      );
    }
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
