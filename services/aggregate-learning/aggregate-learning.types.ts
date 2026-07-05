export type AggregateLearningSuggestionTarget =
  | "mentor-method-library"
  | "mentor-expertise-library"
  | "mentor-source-library"
  | "mentor-tone-guidance"
  | "product-documentation";

export type AggregateLearningSignalSource =
  | "admin-curated-observation"
  | "privacy-preserving-aggregate-metric";

export type AggregateLearningReviewStatus =
  | "draft"
  | "needs-admin-review"
  | "approved"
  | "rejected";

export interface AggregateThemeSignal {
  confidence: "low" | "medium" | "high";
  containsPersonalData: false;
  description: string;
  domains: string[];
  occurrenceCount: number;
  rawUserTextIncluded: false;
  source: AggregateLearningSignalSource;
  themeLabel: string;
}

export interface AggregateLearningSuggestion {
  evidenceSummary: string;
  requiredReview: "admin-approval";
  reviewStatus: AggregateLearningReviewStatus;
  safetyNotes: string[];
  suggestedAction: string;
  summary: string;
  target: AggregateLearningSuggestionTarget;
  title: string;
}

export interface CreateAggregateLearningSuggestionsInput {
  signals: AggregateThemeSignal[];
}

export interface AggregateLearningSuggestionResult {
  isEnabled: false;
  reason: string;
  suggestions: AggregateLearningSuggestion[];
}

export interface AggregateLearningSuggestionService {
  createSuggestions(
    input: CreateAggregateLearningSuggestionsInput,
  ): AggregateLearningSuggestionResult;
}
