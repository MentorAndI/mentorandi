import type { ActiveMentorSlug } from "@/services/mentor-catalog/mentor-catalog.types";

export interface DemoScenario {
  helpsWith: string;
  mentorName: string;
  prompt: string;
  slug: ActiveMentorSlug;
}

export const demoScenarios: DemoScenario[] = [
  {
    helpsWith:
      "Task initiation, time awareness, realistic structure, and follow-through without shame.",
    mentorName: "ADHD Mentor",
    prompt:
      "I keep avoiding an important task even though I know I need to do it.",
    slug: "adhd",
  },
  {
    helpsWith:
      "Communication, recurring conflict patterns, boundaries, and repair conversations.",
    mentorName: "Relationship Mentor",
    prompt:
      "My partner and I keep arguing about small things and it escalates.",
    slug: "relationship",
  },
  {
    helpsWith:
      "Self-doubt, imposter feelings, speaking up, and taking action before certainty.",
    mentorName: "Confidence Mentor",
    prompt: "I feel like I am not good enough even when I do well.",
    slug: "confidence",
  },
  {
    helpsWith:
      "Overload, capacity, boundaries, recovery, and more sustainable expectations.",
    mentorName: "Stress / Burnout Mentor",
    prompt: "I feel overloaded and I can’t recover even when I rest.",
    slug: "stress-burnout",
  },
  {
    helpsWith:
      "Direction, decisions, habits, recurring patterns, and grounded next steps.",
    mentorName: "Life Mentor",
    prompt: "I feel stuck and I don’t know what I should change first.",
    slug: "life",
  },
];
