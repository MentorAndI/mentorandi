import { createHash } from "node:crypto";

export type CrisisSafetyClassification = "none" | "concern" | "high";

export interface CrisisSafetyDecision {
  classification: CrisisSafetyClassification;
  overrideMentorResponse: boolean;
  ruleId: string;
}

interface SafetyRule {
  id: string;
  pattern: RegExp;
}

const highRiskRules: SafetyRule[] = [
  {
    id: "current_suicidal_state",
    pattern: /\b(?:i am|i'm|im)\s+(?:feeling\s+)?suicidal\b/i,
  },
  {
    id: "direct_suicide_intent",
    pattern:
      /\b(?:i|i'm|im)\s+(?:really\s+)?(?:want|plan|intend|am planning|am going|going|gonna|about)\s+to\s+(?:kill myself|end my life|die|commit suicide)\b/i,
  },
  {
    id: "direct_self_harm_intent",
    pattern:
      /\b(?:i|i'm|im)\s+(?:really\s+)?(?:want|plan|intend|am planning|am going|going|gonna|about)\s+to\s+(?:hurt myself|harm myself|cut myself|overdose)\b/i,
  },
  {
    id: "immediate_suicide_statement",
    pattern: /\b(?:i want to die|i need to die|i should die|i'm going to die by suicide)\b/i,
  },
  {
    id: "active_method_access",
    pattern:
      /\b(?:i have|i've got|i got)\s+(?:the\s+)?(?:pills|a gun|a weapon|a rope|a knife)\b.{0,80}\b(?:kill myself|end my life|suicide|overdose|hurt myself)\b/i,
  },
];

const concernRules: SafetyRule[] = [
  {
    id: "suicide_reference",
    pattern: /\b(?:suicidal|suicide|kill myself|want to die|end my life)\b/i,
  },
  {
    id: "self_harm_reference",
    pattern: /\b(?:self[- ]harm|hurt myself|harm myself|cut myself|overdose)\b/i,
  },
  {
    id: "severe_hopelessness",
    pattern: /\b(?:no reason to live|there is no point in living|can't go on|cannot go on)\b/i,
  },
];

const explicitNegations = [
  /\b(?:i am not|i'm not|im not)\s+suicidal\b/i,
  /\b(?:i do not|i don't|i dont)\s+want to die\b/i,
  /\b(?:i do not|i don't|i dont)\s+want to kill myself\b/i,
];

export function evaluateCrisisSafety(message: string): CrisisSafetyDecision {
  const normalized = message.trim();

  if (!normalized) {
    return {
      classification: "none",
      overrideMentorResponse: false,
      ruleId: "empty",
    };
  }

  const isExplicitlyNegated = explicitNegations.some((pattern) =>
    pattern.test(normalized),
  );

  if (!isExplicitlyNegated) {
    const highRule = highRiskRules.find((rule) => rule.pattern.test(normalized));
    if (highRule) {
      return {
        classification: "high",
        overrideMentorResponse: true,
        ruleId: highRule.id,
      };
    }
  }

  const concernRule = concernRules.find((rule) => rule.pattern.test(normalized));
  if (concernRule) {
    return {
      classification: "concern",
      overrideMentorResponse: false,
      ruleId: isExplicitlyNegated
        ? `${concernRule.id}_negated`
        : concernRule.id,
    };
  }

  return {
    classification: "none",
    overrideMentorResponse: false,
    ruleId: "none",
  };
}

export function buildCrisisSafetyResponse() {
  return [
    "I'm concerned about your immediate safety. Mentor And I is an AI mentoring service, not emergency care, so ordinary mentoring should not continue while you may be in immediate danger.",
    "If you might act on this now, contact your local emergency services or go to the nearest emergency department. If you can, move away from anything you could use to hurt yourself and get another person physically with you now.",
    'Tell a trusted person plainly: “I’m not safe alone right now. Please stay with me and help me get urgent support.”',
    "If you are not in immediate danger, contact a licensed mental-health professional or crisis service in your country today. You can return to mentoring after you have connected with human support.",
  ].join("\n\n");
}

export function buildFailSafeSafetyDecision(): CrisisSafetyDecision {
  return {
    classification: "high",
    overrideMentorResponse: true,
    ruleId: "safety_evaluator_failure",
  };
}

export function logCrisisSafetyDecision(
  decision: CrisisSafetyDecision,
  conversationId: string,
) {
  const conversationRef = createHash("sha256")
    .update(conversationId)
    .digest("hex")
    .slice(0, 12);

  console.info(
    JSON.stringify({
      classification: decision.classification,
      conversationRef,
      event: "mentor_crisis_safety_decision",
      overrideMentorResponse: decision.overrideMentorResponse,
      ruleId: decision.ruleId,
    }),
  );
}
