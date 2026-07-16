import type { MentorSourceCard } from "@/services/mentor-sources/source-types";

export const mentorSourceLibrary: MentorSourceCard[] = [
  {
    id: "adhd-cdc-overview-v1",
    title: "CDC ADHD overview",
    url: "https://www.cdc.gov/adhd/",
    sourceType: "public health overview",
    domain: "ADHD",
    tags: ["adhd", "executive function", "attention", "focus"],
    summary:
      "ADHD can involve attention, impulsivity, and executive-function challenges. Practical structure and support can reduce friction.",
    keyPrinciples: [
      "Use external structure rather than relying only on willpower.",
      "Make tasks visible, concrete, and easier to start.",
      "Avoid shame-based framing.",
    ],
    whenRelevant:
      "When a user mentions ADHD, difficulty starting, distraction, procrastination, or focus problems.",
    reliabilityNote:
      "Public health source; useful for general framing, not diagnosis or medical treatment advice.",
    lastReviewed: "2026-07-05",
  },
  {
    id: "adhd-chadd-adult-support-v1",
    title: "CHADD adult ADHD support overview",
    url: "https://chadd.org/for-adults/overview/",
    sourceType: "education and advocacy resource",
    domain: "ADHD",
    tags: ["adult adhd", "systems", "accountability", "task initiation"],
    summary:
      "Adult ADHD support often emphasizes realistic systems, environmental design, accountability, and reducing executive-function load.",
    keyPrinciples: [
      "Reduce friction before asking for effort.",
      "Use small starts and visible next actions.",
      "Support attention with structure and accountability.",
    ],
    whenRelevant:
      "When the user needs non-shaming support for task initiation, distraction, or follow-through.",
    reliabilityNote:
      "Specialized education organization; adapt as practical mentoring, not personalized healthcare.",
    lastReviewed: "2026-07-05",
  },
  {
    id: "overthinking-act-cognitive-defusion-v1",
    title: "ACT cognitive defusion overview",
    url: "https://contextualscience.org/cognitive_defusion",
    sourceType: "clinical framework overview",
    domain: "overthinking",
    tags: ["overthinking", "rumination", "thoughts", "defusion"],
    summary:
      "Cognitive defusion helps people relate differently to repetitive thoughts instead of treating every thought as a command or fact.",
    keyPrinciples: [
      "Notice thoughts as mental events.",
      "Separate replaying from useful planning.",
      "Move toward workable action when analysis stops helping.",
    ],
    whenRelevant:
      "When the user keeps replaying, spiraling, ruminating, or feels stuck in their head.",
    reliabilityNote:
      "Established therapeutic framework; use as broad mentoring inspiration, not therapy.",
    lastReviewed: "2026-07-05",
  },
  {
    id: "overthinking-decision-quality-v1",
    title: "Decision Quality framework overview",
    url: "https://www.decisioneducation.org/decision-quality",
    sourceType: "decision education framework",
    domain: "overthinking",
    tags: ["decision", "clarity", "uncertainty", "overthinking"],
    summary:
      "Good decisions can be improved by clarifying values, options, information, reasoning, commitment, and useful action.",
    keyPrinciples: [
      "Ask what information would actually change the decision.",
      "Separate uncertainty from indecision.",
      "Choose a next step that improves clarity or commitment.",
    ],
    whenRelevant:
      "When the user cannot decide, loops through the same choice, or wants decision-loop guidance.",
    reliabilityNote:
      "Education framework; useful for structure, not a guarantee of outcomes.",
    lastReviewed: "2026-07-05",
  },
  {
    id: "productivity-gtd-next-action-v1",
    title: "Getting Things Done next-action overview",
    url: "https://gettingthingsdone.com/what-is-gtd/",
    sourceType: "productivity framework",
    domain: "focus support",
    tags: ["productivity", "next action", "capture", "clarity"],
    summary:
      "Capturing tasks externally and clarifying the next visible action can reduce mental load and support follow-through.",
    keyPrinciples: [
      "Externalize open loops.",
      "Define the next visible action.",
      "Clarify done enough before starting.",
    ],
    whenRelevant:
      "When the user asks what to focus on, feels overwhelmed by tasks, or needs a concrete next action.",
    reliabilityNote:
      "Popular productivity framework; use flexibly and avoid rigid productivity ideology.",
    lastReviewed: "2026-07-05",
  },
  {
    id: "productivity-deep-work-v1",
    title: "Deep Work concept overview",
    url: "https://www.calnewport.com/books/deep-work/",
    sourceType: "productivity book overview",
    domain: "focus support",
    tags: ["focus", "deep work", "attention", "distraction"],
    summary:
      "Distraction-free blocks of focused work can support demanding tasks when paired with clear scope and realistic capacity.",
    keyPrinciples: [
      "Protect attention for one meaningful task.",
      "Use bounded focus blocks.",
      "Match task scope to available time and energy.",
    ],
    whenRelevant:
      "When the user needs focus, time boxing, fewer distractions, or a single priority.",
    reliabilityNote:
      "Influential productivity concept; adapt to the user's real capacity and constraints.",
    lastReviewed: "2026-07-05",
  },
  {
    id: "life-design-prototype-v1",
    title: "Designing Your Life resources",
    url: "https://designingyour.life/resources-authorized/",
    sourceType: "life design resource",
    domain: "life mentoring",
    tags: ["life design", "values", "experiments", "direction"],
    summary:
      "Life-design work often uses reframing, small experiments, and prototypes instead of waiting for total certainty.",
    keyPrinciples: [
      "Turn vague life questions into small experiments.",
      "Use values and energy as decision signals.",
      "Prototype before overcommitting.",
    ],
    whenRelevant:
      "When the user feels stuck, wants direction, or needs a concrete life next step.",
    reliabilityNote:
      "Educational framework; useful for mentoring, not clinical certainty.",
    lastReviewed: "2026-07-05",
  },
  {
    id: "life-act-values-v1",
    title: "ACT values overview",
    url: "https://contextualscience.org/values",
    sourceType: "clinical framework overview",
    domain: "life mentoring",
    tags: ["values", "meaning", "committed action", "life"],
    summary:
      "Values can guide action even when emotions or uncertainty are present, helping people choose workable behavior.",
    keyPrinciples: [
      "Clarify what the choice should stand for.",
      "Distinguish values from goals.",
      "Choose a small action aligned with what matters.",
    ],
    whenRelevant:
      "When the user asks about meaning, direction, identity, priorities, or a values-based choice.",
    reliabilityNote:
      "Established therapeutic framework; use as general mentoring guidance, not therapy.",
    lastReviewed: "2026-07-05",
  },
  {
    id: "relationship-gottman-repair-v1",
    title: "Gottman relationship research overview",
    url: "https://www.gottman.com/about/research/",
    sourceType: "relationship research organization",
    domain: "relationship communication",
    tags: ["relationship", "conflict", "repair", "partner"],
    summary:
      "Relationship communication is shaped by conflict patterns, repair attempts, emotional bids, and the ability to de-escalate.",
    keyPrinciples: [
      "Notice the conflict pattern before solving content.",
      "Use repair attempts early.",
      "Speak from the specific current moment rather than global blame.",
    ],
    whenRelevant:
      "When the user argues with a partner, has conflict loops, or wants communication help.",
    reliabilityNote:
      "Research-informed relationship education source; not a substitute for therapy or safety planning.",
    lastReviewed: "2026-07-05",
  },
  {
    id: "relationship-nvc-needs-requests-v1",
    title: "Nonviolent Communication overview",
    url: "https://www.cnvc.org/learn-nvc/what-is-nvc",
    sourceType: "communication framework",
    domain: "relationship communication",
    tags: ["communication", "needs", "requests", "conflict"],
    summary:
      "NVC separates observations, feelings, needs, and requests to support clearer conversations during conflict.",
    keyPrinciples: [
      "Separate observation from interpretation.",
      "Name needs without blame.",
      "Make a specific, doable request.",
    ],
    whenRelevant:
      "When the user needs help preparing a hard conversation or communicating without escalating.",
    reliabilityNote:
      "Widely used communication framework; use practically, not as a rigid script.",
    lastReviewed: "2026-07-05",
  },
];
