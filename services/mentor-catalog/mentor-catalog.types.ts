import type { MentorExpertiseDomain } from "@/services/mentor-expertise/expertise-types";

export type ActiveMentorSlug =
  | "life"
  | "adhd"
  | "relationship"
  | "stress-burnout"
  | "parenting"
  | "health-fitness"
  | "focus"
  | "confidence";

export interface ActiveMentorProfile {
  boundaries: string[];
  databaseSlug: string;
  exampleOpeningLine: string;
  expertiseDomain: MentorExpertiseDomain;
  helpsWith: string[];
  name: string;
  personaPrompt: string[];
  shortDescription: string;
  slug: ActiveMentorSlug;
  tone: string;
  whoThisIsFor: string;
}
