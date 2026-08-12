import {
  feedbackCategories,
  feedbackRatings,
  type FeedbackCategoryInput,
  type FeedbackRatingInput,
  type FeedbackValidationResult,
} from "@/services/feedback/feedback.types";

export const feedbackMessageMaxLength = 2000;
export const feedbackPagePathMaxLength = 500;
export const feedbackMentorSlugMaxLength = 100;

const legacyRatingScores: Record<string, FeedbackRatingInput> = {
  USEFUL: 5,
  NEUTRAL: 3,
  NOT_USEFUL: 1,
};

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

  const rawRating = "rating" in body ? body.rating : undefined;
  const rating = normalizeRating(rawRating);
  const category = "category" in body ? body.category : undefined;
  const message =
    "message" in body && typeof body.message === "string"
      ? body.message.trim()
      : "";
  const pagePath =
    "pagePath" in body && typeof body.pagePath === "string"
      ? body.pagePath.trim()
      : "";
  const mentorSlug =
    "mentorSlug" in body && typeof body.mentorSlug === "string"
      ? body.mentorSlug.trim()
      : "";

  if (
    rawRating !== undefined &&
    rawRating !== null &&
    rawRating !== "" &&
    !feedbackRatings.includes(rating as FeedbackRatingInput)
  ) {
    errors.rating = "Rating must be a whole number from 1 to 5.";
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

  if (mentorSlug.length > feedbackMentorSlugMaxLength) {
    errors.mentorSlug = `Mentor slug must be ${feedbackMentorSlugMaxLength} characters or fewer.`;
  } else if (mentorSlug && !/^[a-z0-9-]+$/.test(mentorSlug)) {
    errors.mentorSlug = "Mentor slug must use lowercase letters, numbers, or dashes.";
  }

  if (Object.keys(errors).length > 0) {
    return { errors, isValid: false };
  }

  return {
    errors,
    input: {
      category: category as FeedbackCategoryInput,
      message,
      mentorSlug: mentorSlug || undefined,
      pagePath: pagePath || undefined,
      rating,
    },
    isValid: true,
  };
}

function normalizeRating(value: unknown): FeedbackRatingInput | undefined {
  if (typeof value === "number" && Number.isInteger(value)) {
    return feedbackRatings.includes(value as FeedbackRatingInput)
      ? (value as FeedbackRatingInput)
      : undefined;
  }

  if (typeof value === "string" && value in legacyRatingScores) {
    return legacyRatingScores[value];
  }

  return undefined;
}
