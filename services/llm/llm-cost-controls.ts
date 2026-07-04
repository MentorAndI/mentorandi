export interface LlmCostControls {
  contextBudgetTokens: number;
  goalsLimit: number;
  maxOutputTokens: number;
  memoriesLimit: number;
  recentMessagesLimit: number;
  reflectionsLimit: number;
}

const defaultCostControls: LlmCostControls = {
  contextBudgetTokens: 6000,
  goalsLimit: 3,
  maxOutputTokens: 500,
  memoriesLimit: 5,
  recentMessagesLimit: 8,
  reflectionsLimit: 5,
};

export function getLlmCostControls(): LlmCostControls {
  return {
    contextBudgetTokens: readPositiveInteger(
      "LLM_CONTEXT_BUDGET_TOKENS",
      defaultCostControls.contextBudgetTokens,
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
    recentMessagesLimit: readPositiveInteger(
      "LLM_RECENT_MESSAGES_LIMIT",
      defaultCostControls.recentMessagesLimit,
    ),
    reflectionsLimit: readPositiveInteger(
      "LLM_REFLECTIONS_LIMIT",
      defaultCostControls.reflectionsLimit,
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
