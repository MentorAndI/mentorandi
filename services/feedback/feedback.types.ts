export const feedbackRatings = [1, 2, 3, 4, 5] as const;
export const legacyFeedbackRatings = [
  "USEFUL",
  "NEUTRAL",
  "NOT_USEFUL",
] as const;
export const feedbackCategories = [
  "BUG",
  "CONFUSING",
  "MENTOR_QUALITY",
  "ONBOARDING",
  "PRICING",
  "IDEA",
  "OTHER",
] as const;

export type FeedbackRatingInput = (typeof feedbackRatings)[number];
export type LegacyFeedbackRating = (typeof legacyFeedbackRatings)[number];
export type FeedbackCategoryInput = (typeof feedbackCategories)[number];

export interface CreateFeedbackInput {
  category: FeedbackCategoryInput;
  message: string;
  mentorSlug?: string;
  pagePath?: string;
  rating?: FeedbackRatingInput;
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
  mentorSlug: string | null;
  pagePath: string | null;
  rating: LegacyFeedbackRating;
  ratingScore: number | null;
  userEmail: string;
}
