import { mentorMethodLibrary } from "@/services/mentor-methods/method-library";
import type {
  MatchMentorMethodsInput,
  MentorMethod,
  MentorMethodMatch,
} from "@/services/mentor-methods/method-types";

const defaultMethodLimit = 2;

const domainSignals: Record<MentorMethod["domain"], string[]> = {
  ADHD: [
    "adhd",
    "procrastination",
    "task initiation",
    "can't start",
    "cannot start",
    "cant start",
    "get started",
    "distracted",
    "distraction",
    "scattered",
    "body doubling",
    "time boxing",
    "time blindness",
    "accountability",
  ],
  Overthinking: [
    "overthinking",
    "overthink",
    "stuck in my head",
    "decision",
    "can't decide",
    "cannot decide",
    "cant decide",
    "keep replaying",
    "replaying",
    "rumination",
    "ruminating",
    "spiraling",
  ],
  "Life mentor": [
    "values",
    "meaning",
    "life",
    "direction",
    "energy",
    "burnout",
    "pattern",
    "stuck",
  ],
  Focus: [
    "what should i focus on today",
    "focus on today",
    "focus today",
    "what should i do today",
    "priority",
    "priorities",
    "productive",
    "productivity",
    "one task",
    "define done",
    "finish",
    "attention",
    "follow through",
  ],
};

const titleSignals: Record<string, string[]> = {
  "Task Entry: 5-minute start": [
    "can't start",
    "cannot start",
    "cant start",
    "get started",
    "start on",
    "task initiation",
  ],
  "Reduce Friction: remove one obstacle before starting": [
    "friction",
    "obstacle",
    "setup",
    "hard to start",
    "avoidance",
  ],
  "Body Doubling": ["body doubling", "co-work", "cowork", "accountability"],
  "Time Boxing": ["time box", "time boxing", "timer", "pomodoro"],
  "Externalize the task": ["externalize", "working memory", "scattered", "overwhelmed"],
  "Shutdown routine": ["shutdown", "end of day", "tomorrow", "wrap up"],
  "Decision-loop breaker": ["decision", "can't decide", "cannot decide", "loop"],
  "Rumination vs planning distinction": [
    "rumination",
    "ruminating",
    "keep replaying",
    "replaying",
    "stuck in my head",
  ],
  "10-minute clarity method": ["clarity", "unclear", "confused", "spiraling"],
  "Next irreversible step": ["irreversible", "point of no return", "can't decide"],
  "Values clarification": ["values", "meaning", "direction", "choice"],
  "One concrete next step": ["next step", "stuck", "what do i do"],
  "Energy audit": ["energy", "drained", "burnout", "tired", "capacity"],
  "Pattern noticing": ["pattern", "again", "always", "keep doing"],
  "One-task commitment": [
    "what should i focus on today",
    "focus on today",
    "focus today",
    "priority",
    "one task",
  ],
  "Finishable task selection": ["finishable", "finish", "too broad", "scope"],
  "Define done": ["define done", "done enough", "finished", "completion"],
  "Distraction parking lot": ["distraction", "distracted", "random thoughts", "parking lot"],
};

export function matchMentorMethods(
  input: MatchMentorMethodsInput,
): MentorMethodMatch[] {
  const currentMessage = normalizeText(input.currentMessage ?? "");
  const recentContext = normalizeText((input.recentContext ?? []).join(" "));
  const limit = input.limit ?? defaultMethodLimit;

  if (!currentMessage && !recentContext) {
    return [];
  }

  return mentorMethodLibrary
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
  let score = 0;

  score += scoreSignals(
    domainSignals[method.domain],
    currentMessage,
    recentContext,
    8,
  );
  score += scoreSignals(method.tags, currentMessage, recentContext, 5);
  score += scoreSignals(
    titleSignals[method.title] ?? [],
    currentMessage,
    recentContext,
    12,
  );

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
