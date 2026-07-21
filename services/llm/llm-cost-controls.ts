export interface LlmCostControls {
  contextBudgetTokens: number;
  expertiseLimit: number;
  goalsLimit: number;
  maxOutputTokens: number;
  memoriesLimit: number;
  methodsLimit: number;
  recentMessagesLimit: number;
  reflectionsLimit: number;
  sourcesLimit: number;
}

const defaultCostControls: LlmCostControls = {
  contextBudgetTokens: 1800,
  expertiseLimit: 1,
  goalsLimit: 2,
  maxOutputTokens: 500,
  memoriesLimit: 2,
  methodsLimit: 2,
  recentMessagesLimit: 4,
  reflectionsLimit: 2,
  sourcesLimit: 1,
};

export function getLlmCostControls(): LlmCostControls {
  return {
    contextBudgetTokens: readPositiveInteger(
      "LLM_CONTEXT_BUDGET_TOKENS",
      defaultCostControls.contextBudgetTokens,
    ),
    expertiseLimit: readPositiveInteger(
      "MENTOR_EXPERTISE_LIMIT",
      defaultCostControls.expertiseLimit,
    ),
    goalsLimit: readPositiveInteger(
      "LLM_GOALS_LIMIT",
      defaultCostControls.goalsLimit,
    ),
    maxOutputTokens: readPositiveInteger(
      "LLM_MAX_OUTPUT_TOKENS",
      defaultCostControls.maxOutputTokens,
    ),
    memoriesLimit: readPositiveInteger(
      "LLM_MEMORIES_LIMIT",
      defaultCostControls.memoriesLimit,
    ),
    methodsLimit: readPositiveInteger(
      "MENTOR_METHODS_LIMIT",
      defaultCostControls.methodsLimit,
    ),
    recentMessagesLimit: readPositiveInteger(
      "LLM_RECENT_MESSAGES_LIMIT",
      defaultCostControls.recentMessagesLimit,
    ),
    reflectionsLimit: readPositiveInteger(
      "LLM_REFLECTIONS_LIMIT",
      defaultCostControls.reflectionsLimit,
    ),
    sourcesLimit: readPositiveInteger(
      "MENTOR_SOURCES_LIMIT",
      defaultCostControls.sourcesLimit,
    ),
  };
}

function readPositiveInteger(name: string, fallback: number) {
  const value = process.env[name]?.trim();

  if (!value) {
    return fallback;
  }

  const parsedValue = Number(value);

  return Number.isInteger(parsedValue) && parsedValue > 0
    ? parsedValue
    : fallback;
}
