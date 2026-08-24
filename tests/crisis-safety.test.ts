import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildCrisisSafetyResponse,
  buildFailSafeSafetyDecision,
  evaluateCrisisSafety,
} from "@/services/safety/crisis-safety";

test("explicit current suicide intent triggers deterministic override", () => {
  for (const message of [
    "I want to kill myself.",
    "I'm suicidal right now.",
    "I am planning to end my life.",
    "I want to hurt myself tonight.",
  ]) {
    const decision = evaluateCrisisSafety(message);
    assert.equal(decision.classification, "high", message);
    assert.equal(decision.overrideMentorResponse, true, message);
  }
});

test("ambiguous or historical safety language is classified as concern without forced override", () => {
  for (const message of [
    "I was suicidal several years ago.",
    "I have struggled with self harm in the past.",
    "I don't want to die, but I feel hopeless.",
  ]) {
    const decision = evaluateCrisisSafety(message);
    assert.equal(decision.classification, "concern", message);
    assert.equal(decision.overrideMentorResponse, false, message);
  }
});

test("benign figurative and informational language does not trigger crisis override", () => {
  for (const message of [
    "This deadline is killing me, but I need help prioritizing.",
    "Can you explain why suicide prevention campaigns use certain wording?",
    "My friend has been struggling and I want to know how to support them.",
    "I'm not suicidal. I am just exhausted and need a better routine.",
  ]) {
    const decision = evaluateCrisisSafety(message);
    assert.notEqual(decision.classification, "high", message);
    assert.equal(decision.overrideMentorResponse, false, message);
  }
});

test("crisis response is deterministic and directs the user to immediate human help", () => {
  const response = buildCrisisSafetyResponse();
  assert.match(response, /AI mentoring service/);
  assert.match(response, /local emergency services/);
  assert.match(response, /nearest emergency department/);
  assert.match(response, /trusted person/);
  assert.match(response, /licensed mental-health professional/);
});

test("safety evaluator failure fails closed to the crisis path", () => {
  assert.deepEqual(buildFailSafeSafetyDecision(), {
    classification: "high",
    overrideMentorResponse: true,
    ruleId: "safety_evaluator_failure",
  });
});
