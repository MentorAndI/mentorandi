import type {
  ExtractMemoryCandidatesInput,
  MemoryCandidate,
  MemoryCandidateCategory,
  MemoryExtractionResult,
} from "@/services/mentor-core/memory-extractor/memory-extractor.types";
import { validateExtractMemoryCandidatesInput } from "@/services/mentor-core/memory-extractor/memory-extractor.validators";

interface ExtractionRule {
  category: MemoryCandidateCategory;
  confidence: number;
  importance: number;
  pattern: RegExp;
  titlePrefix: string;
}

const extractionRules: ExtractionRule[] = [
  {
    category: "GOAL",
    confidence: 0.82,
    importance: 4,
    pattern: /\b(?:i want|i need|i am trying to|i'm trying to|my goal is)\s+(.+)/i,
    titlePrefix: "User goal",
  },
  {
    category: "PROJECT",
    confidence: 0.7,
    importance: 3,
    pattern: /\b(?:i am|i'm|we are|we're)\s+(?:building|creating|designing|developing|working on)\s+(.+)/i,
    titlePrefix: "User project",
  },
  {
    category: "CHALLENGE",
    confidence: 0.86,
    importance: 4,
    pattern: /\bi struggle with\s+(.+)/i,
    titlePrefix: "User challenge",
  },
  {
    category: "VALUE",
    confidence: 0.86,
    importance: 4,
    pattern: /\bi value\s+(.+)/i,
    titlePrefix: "User value",
  },
  {
    category: "PREFERENCE",
    confidence: 0.78,
    importance: 3,
    pattern: /\bi prefer\s+(.+)/i,
    titlePrefix: "User preference",
  },
  {
    category: "PREFERENCE",
    confidence: 0.74,
    importance: 3,
    pattern: /\bi don't like\s+(.+)/i,
    titlePrefix: "User dislike",
  },
  {
    category: "INTEREST",
    confidence: 0.72,
    importance: 3,
    pattern: /\bi like\s+(.+)/i,
    titlePrefix: "User interest",
  },
];

const minimumCandidateLength = 8;
const maximumCandidateLength = 240;

export class MemoryExtractorServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MemoryExtractorServiceError";
  }
}

export class MemoryExtractorService {
  extract(input: ExtractMemoryCandidatesInput): MemoryExtractionResult {
    const validation = validateExtractMemoryCandidatesInput(input);

    if (!validation.isValid || !validation.input) {
      throw new MemoryExtractorServiceError(
        `Invalid memory extraction input: ${Object.values(validation.errors).join(" ")}`,
      );
    }

    const validatedInput = validation.input;
    const candidates = splitIntoCandidateSentences(
      validatedInput.userMessage,
    ).flatMap((sentence) =>
      extractCandidateFromSentence(sentence, validatedInput.conversationId),
    );

    return {
      memoryCandidates: dedupeCandidates(candidates),
    };
  }
}

function splitIntoCandidateSentences(message: string) {
  return message
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function extractCandidateFromSentence(
  sentence: string,
  conversationId: string,
) {
  const rule = extractionRules.find((candidateRule) =>
    candidateRule.pattern.test(sentence),
  );

  if (!rule) {
    return [];
  }

  const content = normalizeExtractedContent(sentence, rule.pattern);

  if (!isUsefulLongTermMemory(content)) {
    return [];
  }

  if (rule.category === "PROJECT" && !isUsefulProjectMemory(sentence, content)) {
    return [];
  }

  return [
    {
      category: rule.category,
      confidence: rule.confidence,
      content,
      importance: rule.importance,
      sourceConversationId: conversationId,
      title: buildMemoryTitle(rule.titlePrefix, content),
    },
  ];
}

function normalizeExtractedContent(sentence: string, pattern: RegExp) {
  const match = sentence.match(pattern);
  const extractedContent = match?.[1] ?? sentence;

  return trimTrailingPunctuation(extractedContent)
    .replace(/^to\s+/i, "")
    .replace(/^help\s+(with\s+)?/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function trimTrailingPunctuation(value: string) {
  return value.replace(/[.!?]+$/g, "");
}

function isUsefulLongTermMemory(content: string) {
  if (content.length < minimumCandidateLength) {
    return false;
  }

  if (content.length > maximumCandidateLength) {
    return false;
  }

  return /\s/.test(content);
}

function isUsefulProjectMemory(sentence: string, content: string) {
  const normalizedSentence = sentence.toLowerCase();
  const normalizedContent = content.toLowerCase();

  if (
    /\b(finishing|finished|wrapping up|just|today|tonight|this morning|this afternoon)\b/.test(
      normalizedSentence,
    )
  ) {
    return false;
  }

  return /\b(mentorandi|mentor and i|project|platform|product|app|business|company)\b/.test(
    `${normalizedSentence} ${normalizedContent}`,
  );
}

function buildMemoryTitle(prefix: string, content: string) {
  const normalizedContent = content.toLowerCase();
  const titleContent =
    normalizedContent.length > 72
      ? `${normalizedContent.slice(0, 69).trim()}...`
      : normalizedContent;

  return `${prefix}: ${titleContent}`;
}

function dedupeCandidates(candidates: MemoryCandidate[]) {
  const seen = new Set<string>();

  return candidates.filter((candidate) => {
    const key = `${candidate.category}:${candidate.content.toLowerCase()}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}
