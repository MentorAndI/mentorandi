import { AdminSpecialistLibraryRepository } from "@/services/mentor-specialization/admin-specialist-library.repository";

export class AdminSpecialistLibraryService {
  constructor(
    private readonly repository = new AdminSpecialistLibraryRepository(),
  ) {}

  async listPacks() {
    const packs = await this.repository.listPacks();
    return packs.map((pack) => ({
      description: pack.description,
      displayName: pack.displayName,
      evalScenarioCount: pack.evalScenarios.length,
      knowledgeCards: pack.knowledgeCards.map((card) => ({
        summary: card.summary,
        title: card.title,
      })),
      safetyRules: pack.safetyRules.map((rule) => ({
        rule: rule.rule,
        severity: rule.severity,
        title: rule.title,
      })),
      slug: pack.slug,
      sources: pack.sources.map((source) => ({
        publisher: source.publisher,
        title: source.title,
      })),
      status: pack.status,
      techniques: pack.techniques.map((technique) => ({
        summary: technique.summary,
        title: technique.title,
      })),
      version: pack.version,
    }));
  }
}
