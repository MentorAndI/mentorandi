import { activeMentorProfiles } from "@/services/mentor-catalog/mentor-catalog";
import type { ActiveMentorSlug } from "@/services/mentor-catalog/mentor-catalog.types";

export interface DemoScenario {
  boundary?: string;
  description: string;
  mentorName: string;
  prompt: string;
  slug: ActiveMentorSlug;
  tags: [string, string, string];
}

const demoPrompts: Record<ActiveMentorSlug, string> = {
  adhd: "I keep avoiding an important task even though I know I need to do it.",
  charisma: "I want to be more present and engaging when I meet new people.",
  focus: "I keep getting distracted and reach the end of the day without finishing what matters.",
  "health-fitness": "I start health routines with good intentions, but I cannot make them last in real life.",
  life: "I feel stuck and I don’t know what I should change first.",
  parenting: "I keep losing patience during the same family routine and feel guilty afterward.",
  relationship: "My partner and I keep arguing about small things and it escalates.",
  "stress-burnout": "I feel overloaded and I can’t recover even when I rest.",
};

export const demoScenarios: DemoScenario[] = activeMentorProfiles.map(
  (profile) => ({
    ...(profile.cardBoundary ? { boundary: profile.cardBoundary } : {}),
    description: profile.shortDescription,
    mentorName: profile.cardName,
    prompt: demoPrompts[profile.slug],
    slug: profile.slug,
    tags: profile.cardTags,
  }),
);
