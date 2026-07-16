import { FeedbackRepository } from "@/services/feedback/feedback.repository";
import type {
  AdminFeedbackEntry,
  CreateFeedbackInput,
} from "@/services/feedback/feedback.types";
import { validateCreateFeedbackInput } from "@/services/feedback/feedback.validators";

const adminFeedbackLimit = 100;

export class FeedbackServiceError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
    this.name = "FeedbackServiceError";
  }
}

export class FeedbackService {
  constructor(private readonly repository = new FeedbackRepository()) {}

  async getRecentFeedbackForAdmin(): Promise<AdminFeedbackEntry[]> {
    const feedback = await this.repository.findRecentFeedback(adminFeedbackLimit);

    return feedback.map((entry) => ({
      ...entry,
      createdAt: entry.createdAt.toISOString(),
    }));
  }

  async createFeedbackForUserId(userId: string, input: CreateFeedbackInput) {
    const validation = validateCreateFeedbackInput(input);

    if (!validation.isValid || !validation.input) {
      throw new FeedbackServiceError(
        `Invalid feedback input: ${Object.values(validation.errors).join(" ")}`,
        400,
      );
    }

    const feedback = await this.repository.createFeedbackForUser(
      userId,
      validation.input,
    );

    return { createdAt: feedback.createdAt.toISOString() };
  }
}
