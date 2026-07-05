import type {
  AggregateLearningSuggestionResult,
  AggregateLearningSuggestionService,
  CreateAggregateLearningSuggestionsInput,
} from "@/services/aggregate-learning/aggregate-learning.types";

export const AGGREGATE_LEARNING_DISABLED_REASON =
  "Aggregate learning suggestions are design-only in v1. No cross-user learning is implemented.";

export class DisabledAggregateLearningSuggestionService
  implements AggregateLearningSuggestionService
{
  createSuggestions(
    input: CreateAggregateLearningSuggestionsInput,
  ): AggregateLearningSuggestionResult {
    void input;

    return {
      isEnabled: false,
      reason: AGGREGATE_LEARNING_DISABLED_REASON,
      suggestions: [],
    };
  }
}

export function createAggregateLearningSuggestionService(): AggregateLearningSuggestionService {
  return new DisabledAggregateLearningSuggestionService();
}
