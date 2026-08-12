import type { ActiveMentorSlug } from "@/services/mentor-catalog/mentor-catalog.types";

export type MentorMethodDomain =
  | "ADHD"
  | "Charisma"
  | "Focus"
  | "Health & Fitness"
  | "Life"
  | "Parenting"
  | "Relationship"
  | "Stress / Burnout";

export interface MentorMethod {
  domain: MentorMethodDomain;
  exampleQuestion: string;
  id: string;
  mentorInstruction: string;
  mentorSlug: ActiveMentorSlug;
  shortDescription: string;
  tags: string[];
  title: string;
  whenToUse: string;
}

export interface MatchMentorMethodsInput {
  currentMessage?: string | null;
  limit?: number;
  mentorSlug: ActiveMentorSlug;
  recentContext?: string[];
}

export interface MentorMethodMatch {
  method: MentorMethod;
  score: number;
}
