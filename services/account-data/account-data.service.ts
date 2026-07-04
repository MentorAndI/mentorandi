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
      exportedAt: new Date().toISOString(),
      goals: data.goals,
      memories: data.memories,
      messages: data.messages,
      reflections: data.reflections,
      user: data.user,
    };
  }

  async deleteMentorDataForUser(user: UserDto): Promise<AccountDataDeleteCounts> {
    return this.repository.deleteMentorDataForUser(user.id);
  }
}
