export const feedbackRatings = ["USEFUL", "NEUTRAL", "NOT_USEFUL"] as const;
export const feedbackCategories = [
  "BUG",
  "CONFUSING",
  "MENTOR_QUALITY",
  "IDEA",
  "OTHER",
] as const;

export type FeedbackRatingInput = (typeof feedbackRatings)[number];
export type FeedbackCategoryInput = (typeof feedbackCategories)[number];

export interface CreateFeedbackInput {
  category: FeedbackCategoryInput;
  message: string;
  pagePath?: string;
  rating: FeedbackRatingInput;
}

export interface FeedbackValidationResult {
  errors: Record<string, string>;
  input?: CreateFeedbackInput;
  isValid: boolean;
}

export interface AdminFeedbackEntry {
  category: FeedbackCategoryInput;
  createdAt: string;
  message: string;
  pagePath: string | null;
  rating: FeedbackRatingInput;
  userId: string;
}
