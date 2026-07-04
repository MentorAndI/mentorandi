export type MentorMethodDomain =
  | "ADHD / focus"
  | "Life mentor"
  | "Overthinking"
  | "Productivity";

export interface MentorMethod {
  domain: MentorMethodDomain;
  exampleQuestion: string;
  id: string;
  mentorInstruction: string;
  shortDescription: string;
  tags: string[];
  title: string;
  whenToUse: string;
}

export interface MatchMentorMethodsInput {
  currentMessage?: string | null;
  limit?: number;
  recentContext?: string[];
}

export interface MentorMethodMatch {
  method: MentorMethod;
  score: number;
}
