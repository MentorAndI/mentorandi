import type {
  BuildReflectionCandidateInput,
  ReflectionEngineResult,
} from "@/services/mentor-core/reflection-engine/reflection-engine.types";
import { validateBuildReflectionCandidateInput } from "@/services/mentor-core/reflection-engine/reflection-engine.validators";

interface ReflectionRule {
  buildSummary: (content: string) => string;
  pattern: RegExp;
  requiresOngoingSignal: boolean;
}

const reflectionRules: ReflectionRule[] = [
  {
    buildSummary: (content) =>
      `The user expressed a desire to ${normalizeDesireContent(content)}.`,
    pattern: /\b(?:i want to|i need to|i am trying to|i'm trying to|my goal is(?:\s+to)?|i am working toward|i'm working toward)\s+(.+)/i,
    requiresOngoingSignal: true,
  },
  {
    buildSummary: (content) =>
      `The user expressed a desire to get help with ${normalizeReflectionContent(content)}.`,
    pattern: /\bi want help with\s+(.+)/i,
    requiresOngoingSignal: false,
  },
  {
    buildSummary: (content) =>
      `The user described a struggle with ${normalizeReflectionContent(content)}.`,
    pattern: /\bi (?:struggle|am struggling|have been struggling|feel stuck) (?:with|around|on)?\s+(.+)/i,
    requiresOngoingSignal: false,
  },
  {
    buildSummary: (content) =>
      `The user named ${normalizeReflectionContent(content)} as something they value.`,
    pattern: /\bi value\s+(.+)/i,
    requiresOngoingSignal: false,
  },
  {
    buildSummary: (content) =>
      `The user made a decision about ${normalizeReflectionContent(content)}.`,
    pattern: /\bi (?:decided|chose|am deciding|need to decide|have to decide)\s+(.+)/i,
    requiresOngoingSignal: false,
  },
  {
    buildSummary: (content) =>
      `The user shared a meaningful update about ${normalizeReflectionContent(content)}.`,
    pattern: /\bi (?:realized|learned|noticed|started|committed to|changed|made progress on)\s+(.+)/i,
    requiresOngoingSignal: true,
  },
  {
    buildSummary: (content) =>
      `The user is working on a meaningful project commitment around ${normalizeReflectionContent(content)}.`,
    pattern: /\b(?:i am|i'm|we are|we're)\s+(?:building|creating|designing|developing|working on)\s+(.+)/i,
    requiresOngoingSignal: true,
  },
  {
    buildSummary: (content) =>
      `The user described a personal challenge around ${normalizeReflectionContent(content)}.`,
    pattern: /\b(?:it is hard to|it's hard to|i find it difficult to|i feel overwhelmed by|i am worried about|i'm worried about)\s+(.+)/i,
    requiresOngoingSignal: false,
  },
];

const minimumReflectionContentLength = 6;
const maximumReflectionContentLength = 220;

export class ReflectionEngineServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReflectionEngineServiceError";
  }
}

export class ReflectionEngineService {
  buildReflectionCandidate(
    input: BuildReflectionCandidateInput,
  ): ReflectionEngineResult {
    const validation = validateBuildReflectionCandidateInput(input);

    if (!validation.isValid || !validation.input) {
      throw new ReflectionEngineServiceError(
        `Invalid reflection engine input: ${Object.values(validation.errors).join(" ")}`,
      );
    }

    const candidate = splitIntoCandidateSentences(
      validation.input.userMessage,
    ).flatMap(extractReflectionCandidateFromSentence)[0];

    return {
      reflectionCandidate: candidate ?? null,
    };
  }
}

function splitIntoCandidateSentences(message: string) {
  return message
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function extractReflectionCandidateFromSentence(sentence: string) {
  const rule = reflectionRules.find((candidateRule) =>
    candidateRule.pattern.test(sentence),
  );

  if (!rule) {
    return [];
  }

  const content = extractReflectionContent(sentence, rule.pattern);

  if (!isUsefulReflectionContent(content)) {
    return [];
  }

  if (rule.requiresOngoingSignal && !hasMeaningfulOngoingSignal(sentence)) {
    return [];
  }

  return [
    {
      summary: rule.buildSummary(content),
    },
  ];
}

function extractReflectionContent(sentence: string, pattern: RegExp) {
  const match = sentence.match(pattern);
  const extractedContent = match?.[1] ?? sentence;

  return trimTrailingPunctuation(extractedContent)
    .replace(/\s+/g, " ")
    .trim();
}

function isUsefulReflectionContent(content: string) {
  if (content.length < minimumReflectionContentLength) {
    return false;
  }

  if (content.length > maximumReflectionContentLength) {
    return false;
  }

  if (!/\s/.test(content)) {
    return false;
  }

  return !/^(say hello|thank you|thanks|ok|okay|buy|get|pick up|call|text|email|send|pay|book|order)\b/i.test(
    content,
  );
}

function hasMeaningfulOngoingSignal(sentence: string) {
  const normalizedSentence = normalizeForMatching(sentence);

  if (
    /\b(nice weather|weather today|hello|hi|thanks|thank you|ok|okay)\b/.test(
      normalizedSentence,
    )
  ) {
    return false;
  }

  return /\b(accountable|better|build|career|challenge|commit|confident|confidence|consistent|decision|develop|discipline|focused|focus|goal|grow|habit|healthier|improve|learn|life|meaningful|mentorandi|overthinking|personal|practice|project|reduce|struggle|value|work toward)\b/.test(
    normalizedSentence,
  );
}

function normalizeDesireContent(content: string) {
  return normalizeReflectionContent(content)
    .replace(/\bstop overthinking\b/i, "reduce overthinking")
    .replace(/\bstop worrying\b/i, "reduce worrying")
    .replace(/\bstop procrastinating\b/i, "reduce procrastination");
}

function normalizeReflectionContent(content: string) {
  return trimTrailingPunctuation(content)
    .replace(/^to\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function trimTrailingPunctuation(value: string) {
  return value.replace(/[.!?]+$/g, "");
}

function normalizeForMatching(value: string) {
  return value
    .toLowerCase()
    .replace(/mentor\s+and\s+i/g, "mentorandi")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
