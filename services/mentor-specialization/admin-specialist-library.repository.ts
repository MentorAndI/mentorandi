import { getPrismaClient } from "@/lib/prisma";

export class AdminSpecialistLibraryRepository {
  listPacks() {
    return getPrismaClient().mentorSpecialistPack.findMany({
      include: {
        evalScenarios: { select: { id: true } },
        knowledgeCards: { orderBy: { title: "asc" } },
        safetyRules: { orderBy: [{ severity: "desc" }, { title: "asc" }] },
        sources: { orderBy: { title: "asc" } },
        techniques: { orderBy: { title: "asc" } },
      },
      orderBy: { displayName: "asc" },
    });
  }
}
