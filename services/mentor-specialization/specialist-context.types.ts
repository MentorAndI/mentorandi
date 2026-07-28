export const healthConcretePlanInstructions = [
  "The user already asked for a concrete Health & Fitness plan. Give the usable starter plan now; do not ask whether they want it made more concrete later.",
  "Use clear headings, a weekly schedule, and concise lists where they improve usability.",
  "Where relevant, specify full-body strength exercises with sets and rep ranges, incline-walking duration and moderate intensity, a simple progression rule, a flexible meal/plate template, protein-first guidance, and a minimum fallback for busy or missed days.",
] as const;

export interface SelectMentorSpecialistContextInput {
  currentGoalContext?: string[];
  latestUserMessage: string;
  mentorSlug: string;
  recentConversationSummary?: string[];
  userMemorySnippets?: string[];
}

export interface SelectedSpecialistTechnique {
  mentorWording: string;
  slug: string;
  steps: string[];
  summary: string;
  title: string;
}

export interface SelectedSpecialistKnowledgeCard {
  body: string;
  slug: string;
  summary: string;
  title: string;
}

export interface SelectedSpecialistSafetyRule {
  requiredResponseBehavior: string;
  rule: string;
  severity: "CRISIS" | "HIGH" | "NORMAL";
  slug: string;
  title: string;
}

export interface MentorSpecialistContext {
  actionMode: "concrete-plan" | "standard";
  displayName: string;
  estimatedTokens: number;
  knowledgeCards: SelectedSpecialistKnowledgeCard[];
  packSlug: string;
  safetyRules: SelectedSpecialistSafetyRule[];
  sourceHints: Array<{ publisher: string; title: string }>;
  techniques: SelectedSpecialistTechnique[];
  version: string;
}
