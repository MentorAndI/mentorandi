export type MentorSourceDomain =
  | "ADHD / focus"
  | "business decision-making"
  | "life mentoring"
  | "overthinking"
  | "productivity"
  | "relationship communication";

export interface MentorSourceCard {
  domain: MentorSourceDomain;
  id: string;
  keyPrinciples: string[];
  lastReviewed: string;
  reliabilityNote: string;
  sourceType: string;
  summary: string;
  tags: string[];
  title: string;
  url: string;
  whenRelevant: string;
}

export interface MatchMentorSourcesInput {
  currentMessage?: string | null;
  limit?: number;
  matchedExpertiseTitles?: string[];
  matchedMethodTitles?: string[];
  recentContext?: string[];
}

export interface MentorSourceMatch {
  card: MentorSourceCard;
  score: number;
}
