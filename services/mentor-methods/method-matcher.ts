import { mentorMethodLibrary } from "@/services/mentor-methods/method-library";
import type {
  MatchMentorMethodsInput,
  MentorMethod,
  MentorMethodMatch,
} from "@/services/mentor-methods/method-types";

const defaultMethodLimit = 2;
const maximumMethodContext = 2;

export function matchMentorMethods(
  input: MatchMentorMethodsInput,
): MentorMethodMatch[] {
  const currentMessage = normalizeText(input.currentMessage ?? "");
  const recentContext = normalizeText((input.recentContext ?? []).join(" "));
  const requestedLimit = input.limit ?? defaultMethodLimit;
  const limit = Math.min(Math.max(0, requestedLimit), maximumMethodContext);

  if ((!currentMessage && !recentContext) || limit === 0) {
    return [];
  }

  return mentorMethodLibrary
    .filter((method) => method.mentorSlug === input.mentorSlug)
    .map((method) => ({
      method,
      score: scoreMethod(method, currentMessage, recentContext),
    }))
    .filter((match) => match.score > 0)
    .sort(compareMatches)
    .slice(0, limit);
}

function scoreMethod(
  method: MentorMethod,
  currentMessage: string,
  recentContext: string,
) {
  return scoreSignals(method.tags, currentMessage, recentContext, 6);
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

function compareMatches(
  left: MentorMethodMatch,
  right: MentorMethodMatch,
) {
  if (right.score !== left.score) {
    return right.score - left.score;
  }

  return (
    mentorMethodLibrary.indexOf(left.method) -
    mentorMethodLibrary.indexOf(right.method)
  );
}

function normalizeText(text: string) {
  return text.toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, " ").trim();
}
