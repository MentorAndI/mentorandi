export type MentorExpertiseDomain =
  | "ADHD / focus mentor"
  | "business mentor"
  | "life mentor"
  | "productivity mentor"
  | "relationship mentor";

export interface MentorExpertiseSourceNote {
  lastReviewed: string;
  reliabilityNote: string;
  sourceType: string;
  summary: string;
  tags: string[];
  title: string;
  url: string;
}

export interface MentorExpertiseProfile {
  commonUserProblems: string[];
  coreSkills: string[];
  description: string;
  id: string;
  mentorDomain: MentorExpertiseDomain;
  recommendedTone: string;
  relevantMethods: string[];
  riskNotes: string[];
  sourceNotes: MentorExpertiseSourceNote[];
  title: string;
}

export interface MatchMentorExpertiseInput {
  currentMessage?: string | null;
  limit?: number;
  matchedMethodTitles?: string[];
  recentContext?: string[];
}

export interface MentorExpertiseMatch {
  profile: MentorExpertiseProfile;
  score: number;
}
