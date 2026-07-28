import type { Prisma } from "../../lib/generated/prisma/client";
import { MentorSpecialistContextRepository } from "./specialist-context.repository";
import type {
  MentorSpecialistContext,
  SelectMentorSpecialistContextInput,
} from "./specialist-context.types";

const MAX_SPECIALIST_TOKENS = 1_500;
const safetyTerms = /\b(suicid|self[- ]?harm|kill myself|immediate danger|abuse|violent|violence|unsafe|starv|eating disorder|medication|diagnos|injur|child safety|fasting)\b/i;
const healthConcretePlanTerms =
  /\b(?:concrete|konkret|ugeplan|weekly plan|workout plan|training plan|fat[- ]?loss plan|fedttab|styrketræning|strength training|øvelser|exercises|sets?(?:\s*(?:and|og|\/)\s*)reps?|incline walk(?:ing)?|nutrition|ernæring|meal(?:s| plan)?|måltider|madprincipper|food structure|plate structure|kostplan)\b/i;
const stopWords = new Set(["about", "after", "again", "because", "before", "could", "their", "there", "these", "they", "this", "those", "user", "want", "when", "where", "which", "with", "would"]);

type ActivePack = NonNullable<
  Awaited<ReturnType<MentorSpecialistContextRepository["findActivePack"]>>
>;

export class MentorSpecialistContextService {
  constructor(
    private readonly repository = new MentorSpecialistContextRepository(),
  ) {}

  async selectMentorSpecialistContext(
    input: SelectMentorSpecialistContextInput,
  ): Promise<MentorSpecialistContext | null> {
    const pack = await this.repository.findActivePack(input.mentorSlug);
    return pack ? selectFromPack(pack, input) : null;
  }
}

export function selectFromPack(
  pack: ActivePack,
  input: SelectMentorSpecialistContextInput,
): MentorSpecialistContext {
  const primary = terms(input.latestUserMessage);
  const supporting = terms(
    [
      ...(input.recentConversationSummary ?? []),
      ...(input.userMemorySnippets ?? []),
      ...(input.currentGoalContext ?? []),
    ].join(" "),
  );
  const score = (values: string[]) => relevanceScore(values, primary, supporting);
  const concretePlanRequested =
    pack.slug === "health-fitness" &&
    healthConcretePlanTerms.test(input.latestUserMessage);
  const techniques = [...pack.techniques]
    .sort(
      (a, b) =>
        scoreTechnique(b, score, concretePlanRequested) -
          scoreTechnique(a, score, concretePlanRequested) ||
        b.priority - a.priority,
    )
    .slice(0, 2)
    .map((item) => ({
      mentorWording: truncate(item.mentorWording, 360),
      slug: item.slug,
      steps: jsonStringArray(item.stepsJson).slice(0, 4).map((step) => truncate(step, 180)),
      summary: truncate(item.summary, 420),
      title: item.title,
    }));
  const knowledgeCards = [...pack.knowledgeCards]
    .sort(
      (a, b) =>
        scoreKnowledgeCard(b, score, concretePlanRequested) -
          scoreKnowledgeCard(a, score, concretePlanRequested) ||
        b.priority - a.priority,
    )
    .slice(0, 4)
    .map((item) => ({
      body: truncate(item.body, 600),
      slug: item.slug,
      summary: truncate(item.summary, 360),
      title: item.title,
    }));
  const safetyTriggered = safetyTerms.test(input.latestUserMessage);
  const safetyRules = [...pack.safetyRules]
    .map((item) => ({
      item,
      score: relevanceScore(
        [item.title, item.rule, ...item.triggerPatterns],
        primary,
        supporting,
      ) + (item.severity === "CRISIS" && safetyTriggered ? 100 : 0),
    }))
    .filter(({ item, score: itemScore }) => itemScore > 0 || (safetyTriggered && item.severity !== "NORMAL"))
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map(({ item }) => ({
      requiredResponseBehavior: truncate(item.requiredResponseBehavior, 300),
      rule: truncate(item.rule, 420),
      severity: item.severity,
      slug: item.slug,
      title: item.title,
    }));

  const sourceHints = pack.sources
    .filter((item) => score([item.title, item.usage, item.notes]) > 0)
    .slice(0, 2)
    .map((item) => ({ publisher: item.publisher, title: item.title }));
  const context = {
    actionMode: concretePlanRequested ? "concrete-plan" as const : "standard" as const,
    displayName: pack.displayName,
    estimatedTokens: 0,
    knowledgeCards,
    packSlug: pack.slug,
    safetyRules,
    sourceHints,
    techniques,
    version: pack.version,
  };
  trimToBudget(context);
  context.estimatedTokens = estimateTokens(context);
  return context;
}

function scoreTechnique(
  technique: ActivePack["techniques"][number],
  score: (values: string[]) => number,
  concretePlanRequested: boolean,
) {
  const relevance = score([
    technique.title,
    technique.summary,
    technique.whenToUse,
    ...technique.tags,
  ]);
  if (!concretePlanRequested) return relevance;

  const concretePriority: Record<string, number> = {
    "training-menu": 80,
    "plate-builder": 70,
    "progressive-overload-lite": 60,
    "protein-and-plants-first": 50,
    "minimum-viable-workout": 40,
    "restart-without-punishment": 30,
  };
  return relevance + (concretePriority[technique.slug] ?? 0);
}

function scoreKnowledgeCard(
  card: ActivePack["knowledgeCards"][number],
  score: (values: string[]) => number,
  concretePlanRequested: boolean,
) {
  const relevance = score([
    card.title,
    card.summary,
    ...card.selectionHints,
    ...card.tags,
  ]);
  if (!concretePlanRequested) return relevance;

  const title = card.title.toLowerCase();
  const boost =
    /protein|strength, cardio|real life|consistency|safe plan|nutrition quality|recovery/.test(
      title,
    )
      ? 40
      : 0;
  return relevance + boost;
}

function relevanceScore(
  values: string[],
  primary: Set<string>,
  supporting: Set<string>,
) {
  const candidate = terms(values.join(" "));
  let score = 0;
  for (const term of candidate) {
    if (primary.has(term)) score += 5;
    else if (supporting.has(term)) score += 1;
  }
  return score;
}

function terms(value: string) {
  return new Set(
    value
      .toLowerCase()
      .match(/[a-z][a-z-]{3,}/g)
      ?.filter((term) => !stopWords.has(term)) ?? [],
  );
}

function jsonStringArray(value: Prisma.JsonValue): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function trimToBudget(context: MentorSpecialistContext) {
  while (estimateTokens(context) > MAX_SPECIALIST_TOKENS) {
    if (context.knowledgeCards.length > 2) context.knowledgeCards.pop();
    else if (context.techniques.length > 1) context.techniques.pop();
    else if (context.sourceHints.length > 0) context.sourceHints.pop();
    else break;
  }
}

export function estimateTokens(value: unknown) {
  return Math.ceil(JSON.stringify(value).length / 4);
}

function truncate(value: string, max: number) {
  return value.length <= max ? value : `${value.slice(0, max - 1).trim()}…`;
}
