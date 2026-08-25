import { AccountDataRepository } from "@/services/account-data/account-data.repository";
import type { AccountDataDeleteCounts } from "@/services/account-data/account-data.types";
import type { UserDto } from "@/services/user/user.types";

export class AccountDataServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "AccountDataServiceError";
  }
}

export class AccountDataService {
  constructor(private readonly repository = new AccountDataRepository()) {}

  async exportDataForUser(user: UserDto) {
    const data = await this.repository.exportDataForUser(user.id);

    if (!data.user) {
      throw new AccountDataServiceError("User was not found.", 404);
    }

    return {
      conversations: data.conversations,
      creditAccount: data.creditAccount,
      creditTransactions: data.creditTransactions,
      exportedAt: new Date().toISOString(),
      feedback: data.feedback,
      goals: data.goals,
      journalEntries: data.journalEntries,
      memories: data.memories,
      mentorNotes: data.mentorNotes,
      messages: data.messages,
      reflections: data.reflections,
      subscription: data.subscription,
      usageEvents: data.usageEvents,
      user: data.user,
    };
  }

  async deleteMentorDataForUser(user: UserDto): Promise<AccountDataDeleteCounts> {
    return this.repository.deleteMentorDataForUser(user.id);
  }
}