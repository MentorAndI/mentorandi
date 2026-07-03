import { GoalStatus } from "@/lib/generated/prisma/client";
import type {
  ExtractGoalCandidatesInput,
  GoalCandidate,
  GoalExtractionResult,
} from "@/services/mentor-core/goal-extractor/goal-extractor.types";
import { validateExtractGoalCandidatesInput } from "@/services/mentor-core/goal-extractor/goal-extractor.validators";
import { isDevelopmentTestMessage } from "@/services/mentor-core/test-message-detector";

interface GoalExtractionRule {
  pattern: RegExp;
  titleMode: "direct" | "help-with";
  trustAsOngoingGoal: boolean;
}

const extractionRules: GoalExtractionRule[] = [
  {
    pattern: /\bmy goal is(?:\s+to)?\s+(.+)/i,
    titleMode: "direct",
    trustAsOngoingGoal: true,
  },
  {
    pattern: /\bi want to\s+(become\s+.+)/i,
    titleMode: "direct",
    trustAsOngoingGoal: true,
  },
  {
    pattern: /\b(?:i am|i'm)\s+working toward\s+(.+)/i,
    titleMode: "direct",
    trustAsOngoingGoal: true,
  },
  {
    pattern: /\b(?:i am|i'm)\s+trying to\s+(.+)/i,
    titleMode: "direct",
    trustAsOngoingGoal: false,
  },
  {
    pattern: /\bi want help with\s+(.+)/i,
    titleMode: "help-with",
    trustAsOngoingGoal: true,
  },
  {
    pattern: /\bi need help(?:\s+with)?\s+(.+)/i,
    titleMode: "help-with",
    trustAsOngoingGoal: true,
  },
  {
    pattern: /\bi want to\s+(.+)/i,
    titleMode: "direct",
    trustAsOngoingGoal: false,
  },
  {
    pattern: /\bi need to\s+(.+)/i,
    titleMode: "direct",
    trustAsOngoingGoal: false,
  },
];

const minimumGoalContentLength = 8;
const maximumGoalContentLength = 120;

export class GoalExtractorServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GoalExtractorServiceError";
  }
}

export class GoalExtractorService {
  extract(input: ExtractGoalCandidatesInput): GoalExtractionResult {
    const validation = validateExtractGoalCandidatesInput(input);

    if (!validation.isValid || !validation.input) {
      throw new GoalExtractorServiceError(
        `Invalid goal extraction input: ${Object.values(validation.errors).join(" ")}`,
      );
    }

    const validatedInput = validation.input;

    if (isDevelopmentTestMessage(validatedInput.userMessage)) {
      return {
        goalCandidates: [],
      };
    }

    const goalCandidates = splitIntoCandidateSentences(
      validatedInput.userMessage,
    ).flatMap((sentence) =>
      extractGoalCandidateFromSentence(
        sentence,
        validatedInput.conversationId,
      ),
    );

    return {
      goalCandidates: dedupeGoalCandidates(goalCandidates),
    };
  }
}

function splitIntoCandidateSentences(message: string) {
  return message
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function extractGoalCandidateFromSentence(
  sentence: string,
  conversationId: string,
) {
  const rule = extractionRules.find((candidateRule) =>
    candidateRule.pattern.test(sentence),
  );

  if (!rule) {
    return [];
  }

  const extractedContent = normalizeExtractedGoalContent(
    sentence,
    rule.pattern,
  );

  if (!isUsefulGoalContent(extractedContent)) {
    return [];
  }

  if (
    !rule.trustAsOngoingGoal &&
    !hasOngoingGoalSignal(sentence, extractedContent)
  ) {
    return [];
  }

  const title = buildGoalTitle(extractedContent, rule.titleMode);

  return [
    {
      description: buildGoalDescription(title),
      sourceConversationId: conversationId,
      status: GoalStatus.ACTIVE,
      title,
    },
  ];
}

function normalizeExtractedGoalContent(sentence: string, pattern: RegExp) {
  const match = sentence.match(pattern);
  const extractedContent = match?.[1] ?? sentence;

  return trimTrailingPunctuation(extractedContent)
    .replace(/\s+/g, " ")
    .trim();
}

function isUsefulGoalContent(content: string) {
  if (content.length < minimumGoalContentLength) {
    return false;
  }

  if (content.length > maximumGoalContentLength) {
    return false;
  }

  if (!/\s/.test(content)) {
    return false;
  }

  return !/^(buy|get|pick up|call|text|email|send|pay|book|order|visit)\b/i.test(
    content,
  );
}

function hasOngoingGoalSignal(sentence: string, content: string) {
  const normalizedText = normalizeForMatching(`${sentence} ${content}`);

  if (
    /\b(today|tonight|tomorrow|this morning|this afternoon|this evening|this weekend|right now|for lunch|for dinner)\b/.test(
      normalizedText,
    )
  ) {
    return false;
  }

  return /\b(accountable|better|build|career|confident|confidence|consistent|develop|discipline|focused|focus|grow|habit|healthier|improve|learn|life|manage|mentorandi|overthinking|practice|project|reduce|skill|stop|stronger|work toward)\b/.test(
    normalizedText,
  );
}

function buildGoalTitle(
  content: string,
  titleMode: GoalExtractionRule["titleMode"],
) {
  const normalizedContent = trimTrailingPunctuation(content)
    .replace(/\s+/g, " ")
    .trim();
  const helpContent = normalizedContent.replace(/^becoming\b/i, "become");
  const titleContent =
    titleMode === "help-with" && !/^(become|reduce|stop)\b/i.test(helpContent)
      ? `Get help with ${helpContent}`
      : helpContent;

  return capitalizeFirstLetter(titleContent);
}

function buildGoalDescription(title: string) {
  const normalizedTitle = title
    .replace(/^get help with\s+/i, "get help with ")
    .replace(/\bstop overthinking\b/i, "reduce overthinking")
    .replace(/\bstop worrying\b/i, "reduce worrying")
    .replace(/\bstop procrastinating\b/i, "reduce procrastination")
    .trim();

  return `User expressed a desire to ${lowercaseFirstLetter(normalizedTitle)}.`;
}

function trimTrailingPunctuation(value: string) {
  return value.replace(/[.!?]+$/g, "");
}

function capitalizeFirstLetter(value: string) {
  if (!value) {
    return value;
  }

  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function lowercaseFirstLetter(value: string) {
  if (!value) {
    return value;
  }

  return `${value.charAt(0).toLowerCase()}${value.slice(1)}`;
}

function normalizeForMatching(value: string) {
  return value
    .toLowerCase()
    .replace(/mentor\s+and\s+i/g, "mentorandi")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function dedupeGoalCandidates(candidates: GoalCandidate[]) {
  const seen = new Set<string>();

  return candidates.filter((candidate) => {
    const key = normalizeForMatching(candidate.title);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}
