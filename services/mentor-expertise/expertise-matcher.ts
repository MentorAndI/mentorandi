import { mentorExpertiseLibrary } from "@/services/mentor-expertise/expertise-library";
import type {
  MatchMentorExpertiseInput,
  MentorExpertiseMatch,
  MentorExpertiseProfile,
} from "@/services/mentor-expertise/expertise-types";

const defaultExpertiseLimit = 2;

const domainSignals: Record<MentorExpertiseProfile["mentorDomain"], string[]> = {
  "ADHD / focus mentor": [
    "adhd",
    "can't start",
    "cannot start",
    "cant start",
    "get started",
    "distracted",
    "distraction",
    "focus",
    "procrastination",
    "task initiation",
  ],
  "business mentor": [
    "business",
    "startup",
    "sales",
    "leadership",
    "founder",
    "customer",
    "market",
    "strategy",
    "pricing",
    "business decision",
  ],
  "life mentor": [
    "life",
    "direction",
    "values",
    "meaning",
    "stuck",
    "energy",
    "pattern",
    "purpose",
  ],
  "productivity mentor": [
    "productivity",
    "productive",
    "priority",
    "what should i focus on today",
    "focus on today",
    "finish",
    "done",
    "task",
    "distraction",
  ],
  "relationship mentor": [
    "relationship",
    "partner",
    "communication",
    "conflict",
    "arguing",
    "argue",
    "fight",
    "fighting",
    "boundaries",
    "marriage",
  ],
};

export function matchMentorExpertise(
  input: MatchMentorExpertiseInput,
): MentorExpertiseMatch[] {
  const currentMessage = normalizeText(input.currentMessage ?? "");
  const recentContext = normalizeText((input.recentContext ?? []).join(" "));
  const matchedMethods = normalizeText((input.matchedMethodTitles ?? []).join(" "));
  const limit = input.limit ?? defaultExpertiseLimit;

  if (!currentMessage && !recentContext && !matchedMethods) {
    return [];
  }

  return mentorExpertiseLibrary
    .map((profile) => ({
      profile,
      score: scoreProfile(profile, currentMessage, recentContext, matchedMethods),
    }))
    .filter((match) => match.score > 0)
    .sort(compareMatches)
    .slice(0, limit);
}

function scoreProfile(
  profile: MentorExpertiseProfile,
  currentMessage: string,
  recentContext: string,
  matchedMethods: string,
) {
  let score = 0;

  score += scoreSignals(
    domainSignals[profile.mentorDomain],
    currentMessage,
    recentContext,
    12,
  );
  score += scoreSignals(
    [
      profile.mentorDomain,
      profile.title,
      ...profile.coreSkills,
      ...profile.commonUserProblems,
    ],
    currentMessage,
    recentContext,
    7,
  );
  score += profile.relevantMethods.reduce((total, methodTitle) => {
    return matchedMethods.includes(normalizeText(methodTitle)) ? total + 10 : total;
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

function compareMatches(
  left: MentorExpertiseMatch,
  right: MentorExpertiseMatch,
) {
  if (right.score !== left.score) {
    return right.score - left.score;
  }

  return (
    mentorExpertiseLibrary.indexOf(left.profile) -
    mentorExpertiseLibrary.indexOf(right.profile)
  );
}

function normalizeText(text: string) {
  return text.toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, " ").trim();
}
