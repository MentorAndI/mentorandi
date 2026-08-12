import type { ActiveMentorSlug } from "@/services/mentor-catalog/mentor-catalog.types";

export type MentorPlan =
  | "free"
  | "single_mentor"
  | "plus"
  | "premium"
  | "company_stress";

export type DeepSessionAccess = "none" | "limited" | "expanded";

export interface MentorPlanAccessPolicy {
  advancedPrograms: boolean;
  deepSessions: DeepSessionAccess;
  mentorAccess: "life_only" | "selected_specialist" | "all_main" | "stress_only";
  plan: MentorPlan;
}

export interface MentorAccessDecisionInput {
  mentorSlug: ActiveMentorSlug;
  plan: MentorPlan;
  selectedMentorSlug?: ActiveMentorSlug | null;
}

export interface MentorAccessDecision {
  allowed: boolean;
  policy: MentorPlanAccessPolicy;
}

export const mentorPlanAccessPolicies: Record<MentorPlan, MentorPlanAccessPolicy> = {
  company_stress: {
    advancedPrograms: false,
    deepSessions: "limited",
    mentorAccess: "stress_only",
    plan: "company_stress",
  },
  free: {
    advancedPrograms: false,
    deepSessions: "none",
    mentorAccess: "life_only",
    plan: "free",
  },
  plus: {
    advancedPrograms: false,
    deepSessions: "limited",
    mentorAccess: "all_main",
    plan: "plus",
  },
  premium: {
    advancedPrograms: true,
    deepSessions: "expanded",
    mentorAccess: "all_main",
    plan: "premium",
  },
  single_mentor: {
    advancedPrograms: false,
    deepSessions: "none",
    mentorAccess: "selected_specialist",
    plan: "single_mentor",
  },
};

export function evaluateMentorAccess(
  input: MentorAccessDecisionInput,
): MentorAccessDecision {
  const policy = mentorPlanAccessPolicies[input.plan];

  return {
    allowed: canAccessMentor(policy, input),
    policy,
  };
}

function canAccessMentor(
  policy: MentorPlanAccessPolicy,
  input: MentorAccessDecisionInput,
) {
  switch (policy.mentorAccess) {
    case "all_main":
      return true;
    case "life_only":
      return input.mentorSlug === "life";
    case "selected_specialist":
      return (
        input.mentorSlug === "life" ||
        input.mentorSlug === input.selectedMentorSlug
      );
    case "stress_only":
      return input.mentorSlug === "stress-burnout";
  }
}
