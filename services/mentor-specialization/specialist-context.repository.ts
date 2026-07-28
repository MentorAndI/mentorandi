import { getPrismaClient } from "../../lib/prisma";

export class MentorSpecialistContextRepository {
  findActivePack(mentorSlug: string) {
    return getPrismaClient().mentorSpecialistPack.findFirst({
      include: {
        knowledgeCards: { orderBy: [{ priority: "desc" }, { title: "asc" }] },
        safetyRules: { orderBy: [{ severity: "desc" }, { title: "asc" }] },
        sources: { orderBy: { title: "asc" } },
        techniques: { orderBy: [{ priority: "desc" }, { title: "asc" }] },
      },
      where: { mentorSlug, status: "ACTIVE" },
    });
  }
}
