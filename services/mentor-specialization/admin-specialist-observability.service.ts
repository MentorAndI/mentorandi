import { AdminSpecialistObservabilityRepository } from "@/services/mentor-specialization/admin-specialist-observability.repository";

export interface AdminSpecialistSelection {
  conversationId: string;
  createdAt: string;
  knowledgeCards: string[];
  mentor: string;
  promptTokens: number | null;
  safetyRules: string[];
  specialistPack: string;
  techniques: string[];
}

export class AdminSpecialistObservabilityService {
  constructor(
    private readonly repository = new AdminSpecialistObservabilityRepository(),
  ) {}

  async listRecentSelections(): Promise<AdminSpecialistSelection[]> {
    const events = await this.repository.listRecentSelections();

    return events
      .filter(
        (event): event is typeof event & { conversationId: string } =>
          Boolean(event.conversationId),
      )
      .map((event) => ({
        conversationId: event.conversationId,
        createdAt: event.createdAt.toISOString(),
        knowledgeCards: event.selectedKnowledgeTitles,
        mentor:
          event.mentor?.name ??
          event.conversation?.mentor.name ??
          "Mentor unavailable",
        promptTokens: event.specialistPromptTokens,
        safetyRules: event.selectedSafetyRuleTitles,
        specialistPack: event.specialistPackName
          ? `${event.specialistPackName} ${event.specialistPackVersion ?? ""}`.trim()
          : "Not recorded",
        techniques: event.selectedTechniqueTitles,
      }));
  }
}
