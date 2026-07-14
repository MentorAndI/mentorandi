import {
  feedbackCategories,
  feedbackRatings,
  type FeedbackCategoryInput,
  type FeedbackRatingInput,
  type FeedbackValidationResult,
} from "@/services/feedback/feedback.types";

export const feedbackMessageMaxLength = 2000;
export const feedbackPagePathMaxLength = 500;

export function validateCreateFeedbackInput(
  body: unknown,
): FeedbackValidationResult {
  const errors: Record<string, string> = {};

  if (!body || typeof body !== "object") {
    return {
      errors: { body: "Request body must be a JSON object." },
      isValid: false,
    };
  }

  const rating = "rating" in body ? body.rating : undefined;
  const category = "category" in body ? body.category : undefined;
  const message =
    "message" in body && typeof body.message === "string"
      ? body.message.trim()
      : "";
  const pagePath =
    "pagePath" in body && typeof body.pagePath === "string"
      ? body.pagePath.trim()
      : "";

  if (!feedbackRatings.includes(rating as FeedbackRatingInput)) {
    errors.rating = "Choose a valid usefulness rating.";
  }

  if (!feedbackCategories.includes(category as FeedbackCategoryInput)) {
    errors.category = "Choose a valid feedback category.";
  }

  if (!message) {
    errors.message = "Feedback message is required.";
  } else if (message.length > feedbackMessageMaxLength) {
    errors.message = `Feedback message must be ${feedbackMessageMaxLength} characters or fewer.`;
  }

  if (pagePath.length > feedbackPagePathMaxLength) {
    errors.pagePath = `Page context must be ${feedbackPagePathMaxLength} characters or fewer.`;
  }

  if (Object.keys(errors).length > 0) {
    return { errors, isValid: false };
  }

  return {
    errors,
    input: {
      category: category as FeedbackCategoryInput,
      message,
      pagePath: pagePath || undefined,
      rating: rating as FeedbackRatingInput,
    },
    isValid: true,
  };
}
