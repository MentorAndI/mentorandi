import { mentorSourceLibrary } from "@/services/mentor-sources/source-library";
import type {
  MatchMentorSourcesInput,
  MentorSourceCard,
  MentorSourceMatch,
} from "@/services/mentor-sources/source-types";

const defaultSourceLimit = 2;

const domainSignals: Record<MentorSourceCard["domain"], string[]> = {
  ADHD: [
    "adhd",
    "can't start",
    "cannot start",
    "cant start",
    "get started",
    "distracted",
    "procrastination",
    "task initiation",
    "time blindness",
    "accountability",
  ],
  overthinking: [
    "overthinking",
    "overthink",
    "same decision",
    "can't decide",
    "cannot decide",
    "keep replaying",
    "ruminating",
    "stuck in my head",
    "decision loop",
  ],
  "focus support": [
    "productivity",
    "productive",
    "what should i focus on today",
    "focus on today",
    "priority",
    "finish",
    "define done",
    "distraction",
    "attention",
    "follow through",
  ],
  "life mentoring": [
    "life",
    "direction",
    "values",
    "meaning",
    "purpose",
    "stuck",
    "energy",
    "identity",
  ],
  "relationship communication": [
    "relationship",
    "partner",
    "communication",
    "communicate",
    "conflict",
    "arguing",
    "argue",
    "fighting",
    "boundaries",
  ],
};

export function matchMentorSources(
  input: MatchMentorSourcesInput,
): MentorSourceMatch[] {
  const currentMessage = normalizeText(input.currentMessage ?? "");
  const recentContext = normalizeText((input.recentContext ?? []).join(" "));
  const matchedMethods = normalizeText((input.matchedMethodTitles ?? []).join(" "));
  const matchedExpertise = normalizeText(
    (input.matchedExpertiseTitles ?? []).join(" "),
  );
  const limit = input.limit ?? defaultSourceLimit;

  if (!currentMessage && !recentContext && !matchedMethods && !matchedExpertise) {
    return [];
  }

  return mentorSourceLibrary
    .map((card) => ({
      card,
      score: scoreCard(
        card,
        currentMessage,
        recentContext,
        matchedMethods,
        matchedExpertise,
      ),
    }))
    .filter((match) => match.score > 0)
    .sort(compareMatches)
    .slice(0, limit);
}

function scoreCard(
  card: MentorSourceCard,
  currentMessage: string,
  recentContext: string,
  matchedMethods: string,
  matchedExpertise: string,
) {
  let score = 0;

  score += scoreSignals(
    domainSignals[card.domain],
    currentMessage,
    recentContext,
    12,
  );
  score += scoreSignals(
    [
      card.domain,
      card.title,
      card.summary,
      card.whenRelevant,
      ...card.tags,
      ...card.keyPrinciples,
    ],
    currentMessage,
    recentContext,
    5,
  );

  if (matchedExpertise.includes(normalizeText(card.domain))) {
    score += 12;
  }

  score += card.tags.reduce((total, tag) => {
    const normalizedTag = normalizeText(tag);

    return matchedMethods.includes(normalizedTag) ||
      matchedExpertise.includes(normalizedTag)
      ? total + 4
      : total;
  }, 0);

  return score;
}

function scoreSignals(
  signals: string[],
  currentMessage: string,
  recentContext: string,
  currentWeight: number,
) {
  return signals.reduce((total, signal) => {
    const normalizedSignal = normalizeText(signal);
    const currentScore = currentMessage.includes(normalizedSignal)
      ? currentWeight
      : 0;
    const contextScore = recentContext.includes(normalizedSignal)
      ? Math.max(1, Math.floor(currentWeight / 3))
      : 0;

    return total + currentScore + contextScore;
  }, 0);
}

function compareMatches(left: MentorSourceMatch, right: MentorSourceMatch) {
  if (right.score !== left.score) {
    return right.score - left.score;
  }

  return (
    mentorSourceLibrary.indexOf(left.card) -
    mentorSourceLibrary.indexOf(right.card)
  );
}

function normalizeText(text: string) {
  return text.toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, " ").trim();
}
