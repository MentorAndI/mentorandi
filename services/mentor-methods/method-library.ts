import type { MentorMethod } from "@/services/mentor-methods/method-types";

export const mentorMethodLibrary: MentorMethod[] = [
  {
    id: "adhd-task-entry-5-minute-start",
    title: "Task Entry: 5-minute start",
    domain: "ADHD",
    tags: ["adhd", "focus", "procrastination", "task initiation", "start"],
    shortDescription: "Help the user begin with a tiny, time-limited first action.",
    whenToUse: "When the user cannot start, is procrastinating, or feels blocked by task initiation.",
    mentorInstruction:
      "Briefly reflect the friction around starting, then offer one five-minute entry point with a single visible action. Do not add a wider productivity list.",
    exampleQuestion: "What is the smallest five-minute version of starting this?",
  },
  {
    id: "adhd-reduce-friction-remove-one-obstacle",
    title: "Reduce Friction: remove one obstacle before starting",
    domain: "ADHD",
    tags: ["adhd", "focus", "friction", "avoidance", "task initiation"],
    shortDescription: "Identify and remove one practical obstacle that makes starting harder.",
    whenToUse: "When the user wants to work but the setup, ambiguity, or environment is getting in the way.",
    mentorInstruction:
      "Reflect what seems to be creating friction, then help the user remove one obstacle before asking for more effort. Keep the response conversational rather than listing possible obstacles.",
    exampleQuestion: "What is one thing making this harder to start than it needs to be?",
  },
  {
    id: "adhd-body-doubling",
    title: "Body Doubling",
    domain: "ADHD",
    tags: ["adhd", "focus", "accountability", "body doubling", "distracted"],
    shortDescription: "Use another person's presence or a lightweight check-in to support focus.",
    whenToUse: "When the user feels distracted, isolated, or unable to stay with a task alone.",
    mentorInstruction:
      "Reflect the difficulty of holding attention alone, then suggest one realistic form of presence or accountability. Keep it simple and non-shaming.",
    exampleQuestion: "Would a quiet co-working check-in make it easier to begin?",
  },
  {
    id: "adhd-time-boxing",
    title: "Time Boxing",
    domain: "ADHD",
    tags: ["adhd", "focus", "time box", "timer", "distracted"],
    shortDescription: "Contain work inside a short named block of time.",
    whenToUse: "When the user is overwhelmed by an open-ended task or needs focus for a limited period.",
    mentorInstruction:
      "Reflect why the task feels too open-ended, then offer one bounded work period with one task and one stopping point. Emphasize containment over perfection.",
    exampleQuestion: "What would be useful to do in one focused 20-minute box?",
  },
  {
    id: "adhd-externalize-the-task",
    title: "Externalize the task",
    domain: "ADHD",
    tags: ["adhd", "focus", "externalize", "working memory", "overwhelmed"],
    shortDescription: "Move the task out of the user's head into visible steps.",
    whenToUse: "When the user is mentally juggling too much, feels scattered, or cannot see the task clearly.",
    mentorInstruction:
      "Reflect the mental load, then suggest one visible place for the task and its immediate next action. Do not turn the response into a multi-part setup checklist.",
    exampleQuestion: "Can we get this out of your head and into three visible steps?",
  },
  {
    id: "adhd-shutdown-routine",
    title: "Shutdown routine",
    domain: "ADHD",
    tags: ["adhd", "focus", "shutdown", "routine", "end of day"],
    shortDescription: "Close the day with a brief review and prepared next start point.",
    whenToUse: "When the user is ending work, feeling scattered, or needs tomorrow to start more smoothly.",
    mentorInstruction:
      "Reflect the difficulty of mentally leaving work, then offer one short shutdown action that makes tomorrow's first move visible.",
    exampleQuestion: "What should be ready so tomorrow has a clear first move?",
  },
  {
    id: "overthinking-decision-loop-breaker",
    title: "Decision-loop breaker",
    domain: "Overthinking",
    tags: ["overthinking", "decision", "stuck", "can't decide", "loop"],
    shortDescription: "Interrupt repeated analysis by setting criteria and a decision moment.",
    whenToUse: "When the user keeps circling a decision without gaining new information.",
    mentorInstruction:
      "Name the possible analysis loop gently, then offer one bounded decision step. Do not explain a full decision framework unless the user asks.",
    exampleQuestion: "What new information would actually change this decision?",
  },
  {
    id: "overthinking-rumination-vs-planning",
    title: "Rumination vs planning distinction",
    domain: "Overthinking",
    tags: ["overthinking", "rumination", "planning", "replaying", "stuck in my head"],
    shortDescription: "Separate repetitive replay from useful planning.",
    whenToUse: "When the user is replaying, spiraling, or mistaking mental repetition for problem solving.",
    mentorInstruction:
      "Reflect the repetitive thought pattern, distinguish planning from rumination in one sentence, and redirect toward one concrete planning output.",
    exampleQuestion: "Is this thought producing a next action, or only replaying the same discomfort?",
  },
  {
    id: "overthinking-10-minute-clarity",
    title: "10-minute clarity method",
    domain: "Overthinking",
    tags: ["overthinking", "clarity", "stuck", "decision", "anxiety"],
    shortDescription: "Use a short timed reflection to produce a clear next move.",
    whenToUse: "When the user needs clarity but could get lost in unbounded analysis.",
    mentorInstruction:
      "Reflect the need for containment, then offer a brief ten-minute clarity exercise without over-explaining each stage.",
    exampleQuestion: "What question are we trying to answer in the next ten minutes?",
  },
  {
    id: "overthinking-next-irreversible-step",
    title: "Next irreversible step",
    domain: "Overthinking",
    tags: ["overthinking", "decision", "irreversible", "next step", "can't decide"],
    shortDescription: "Find the next step that actually commits the user, and keep earlier steps light.",
    whenToUse: "When the user treats every small action like a final decision.",
    mentorInstruction:
      "Reflect how the user may be treating exploration like final commitment, then offer one low-risk reversible step.",
    exampleQuestion: "What is the next step that would actually make this hard to undo?",
  },
  {
    id: "life-values-clarification",
    title: "Values clarification",
    domain: "Life mentor",
    tags: ["values", "meaning", "life", "choice", "direction"],
    shortDescription: "Clarify what the user wants a choice to stand for.",
    whenToUse: "When the user is choosing between paths or wants direction beyond productivity.",
    mentorInstruction:
      "Reflect the deeper tension in the choice, then help the user identify the single value that should guide the next move.",
    exampleQuestion: "What value do you want this decision to honor most?",
  },
  {
    id: "life-one-concrete-next-step",
    title: "One concrete next step",
    domain: "Life mentor",
    tags: ["life", "next step", "stuck", "action", "clarity"],
    shortDescription: "Turn a broad life concern into one concrete action.",
    whenToUse: "When the user feels stuck, vague, overwhelmed, or needs movement more than analysis.",
    mentorInstruction:
      "Reflect the larger theme briefly, then help choose one specific, doable next step with a clear time or context.",
    exampleQuestion: "What is one concrete step that would make this slightly more real today?",
  },
  {
    id: "life-energy-audit",
    title: "Energy audit",
    domain: "Life mentor",
    tags: ["energy", "burnout", "life", "capacity", "drained"],
    shortDescription: "Notice what is adding to or draining the user's energy.",
    whenToUse: "When the user feels tired, overloaded, burned out, or unsure where capacity is going.",
    mentorInstruction:
      "Reflect the overload or depletion first, then suggest one small adjustment that protects capacity. Avoid turning recovery into another optimization plan.",
    exampleQuestion: "What has been draining you most, and what has been giving even a little energy back?",
  },
  {
    id: "life-pattern-noticing",
    title: "Pattern noticing",
    domain: "Life mentor",
    tags: ["pattern", "self-awareness", "life", "reflection", "repeating"],
    shortDescription: "Spot a repeated behavior or situation without turning it into a judgment.",
    whenToUse: "When the user describes a repeated problem, reaction, or relationship dynamic.",
    mentorInstruction:
      "Gently name one possible pattern, clearly hold it as a hypothesis, and ask one question about the current example.",
    exampleQuestion: "Where have you seen this pattern show up before?",
  },
  {
    id: "productivity-one-task-commitment",
    title: "One-task commitment",
    domain: "Focus",
    tags: ["productivity", "focus", "today", "priority", "one task"],
    shortDescription: "Choose one task to receive the user's real attention now.",
    whenToUse: "When the user asks what to focus on, has too many priorities, or needs a practical anchor.",
    mentorInstruction:
      "Reflect the tension behind competing priorities, then help the user choose one meaningful task and one first work block.",
    exampleQuestion: "If today only had one real focus, what would matter most to move forward?",
  },
  {
    id: "productivity-finishable-task-selection",
    title: "Finishable task selection",
    domain: "Focus",
    tags: ["productivity", "finish", "scope", "priority", "focus"],
    shortDescription: "Select a task small enough to complete and feel progress.",
    whenToUse: "When the user's task is too broad, vague, or likely to sprawl.",
    mentorInstruction:
      "Reflect why the current scope is hard to hold, then narrow it to one realistic finish line for the available energy and time.",
    exampleQuestion: "What version of this could you genuinely finish today?",
  },
  {
    id: "productivity-define-done",
    title: "Define done",
    domain: "Focus",
    tags: ["productivity", "done", "scope", "finish", "clarity"],
    shortDescription: "Make the completion condition explicit before starting.",
    whenToUse: "When the user is unclear about the endpoint or risks overworking a task.",
    mentorInstruction:
      "Reflect the cost of an unclear endpoint, then offer one observable and realistic done condition.",
    exampleQuestion: "What will count as done enough for this task?",
  },
  {
    id: "productivity-distraction-parking-lot",
    title: "Distraction parking lot",
    domain: "Focus",
    tags: ["productivity", "distraction", "focus", "parking lot", "attention"],
    shortDescription: "Capture distractions without following them immediately.",
    whenToUse: "When the user is distracted, context-switching, or pulled by unrelated thoughts.",
    mentorInstruction:
      "Reflect how competing thoughts are pulling attention, then suggest one visible parking place and a return to the chosen task.",
    exampleQuestion: "Where can we park the distractions so you do not have to obey them right now?",
  },
];
