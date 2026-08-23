import assert from "node:assert/strict";
import { test } from "node:test";

import {
  evaluateMentorAccess,
  mentorPlanAccessPolicies,
} from "@/services/mentor-access/mentor-access-policy";
import {
  MentorAccessService,
  MentorAccessServiceError,
  mapStoredPlan,
  mentorLockedMessage,
  mentorUpgradeMessage,
} from "@/services/mentor-access/mentor-access.service";

test("free access is limited to Life Mentor with no deep sessions", () => {
  assert.equal(
    evaluateMentorAccess({ mentorSlug: "life", plan: "free" }).allowed,
    true,
  );
  assert.equal(
    evaluateMentorAccess({ mentorSlug: "adhd", plan: "free" }).allowed,
    false,
  );
  assert.equal(mentorPlanAccessPolicies.free.deepSessions, "none");
});

test("single mentor access includes Life and only the selected specialist", () => {
  assert.equal(
    evaluateMentorAccess({ mentorSlug: "life", plan: "single_mentor" })
      .allowed,
    true,
  );
  assert.equal(
    evaluateMentorAccess({
      mentorSlug: "adhd",
      plan: "single_mentor",
      selectedMentorSlug: "adhd",
    }).allowed,
    true,
  );
  assert.equal(
    evaluateMentorAccess({
      mentorSlug: "charisma",
      plan: "single_mentor",
      selectedMentorSlug: "adhd",
    }).allowed,
    false,
  );
});

test("plus and premium allow all main mentors with different feature tiers", () => {
  assert.equal(
    evaluateMentorAccess({ mentorSlug: "parenting", plan: "plus" }).allowed,
    true,
  );
  assert.equal(
    evaluateMentorAccess({ mentorSlug: "health-fitness", plan: "premium" })
      .allowed,
    true,
  );
  assert.equal(mentorPlanAccessPolicies.plus.deepSessions, "limited");
  assert.equal(mentorPlanAccessPolicies.plus.advancedPrograms, false);
  assert.equal(mentorPlanAccessPolicies.premium.deepSessions, "expanded");
  assert.equal(mentorPlanAccessPolicies.premium.advancedPrograms, true);
});

test("company stress access is isolated to Stress and Burnout Mentor", () => {
  assert.equal(
    evaluateMentorAccess({
      mentorSlug: "stress-burnout",
      plan: "company_stress",
    }).allowed,
    true,
  );
  assert.equal(
    evaluateMentorAccess({ mentorSlug: "life", plan: "company_stress" })
      .allowed,
    false,
  );
});

test("stored billing plans map to their product access tiers", () => {
  assert.equal(mapStoredPlan("FREE"), "free");
  assert.equal(mapStoredPlan("SINGLE"), "single_mentor");
  assert.equal(mapStoredPlan("PLUS"), "plus");
  assert.equal(mapStoredPlan("COMPANY_STRESS"), "company_stress");
  assert.equal(mapStoredPlan("PREMIUM"), "premium");
  assert.equal(mapStoredPlan("FOUNDER"), "premium");
  assert.equal(mapStoredPlan("ALPHA"), "plus");
  assert.equal(mapStoredPlan("PERSONAL"), "plus");
});

test("locked mentor copy is stable and user facing", () => {
  assert.equal(
    mentorLockedMessage,
    "This mentor is not included in your current plan.",
  );
  assert.equal(
    mentorUpgradeMessage,
    "Upgrade to unlock this mentor",
  );
});

test("production users without an active subscription fail down to free", async () => {
  const previousNodeEnv = process.env.NODE_ENV;
  Reflect.set(process.env, "NODE_ENV", "production");

  try {
    const service = new MentorAccessService({
      async claimSingleMentor() {
        return { count: 0 };
      },
      async findOwnedConversationMentor() {
        return { mentor: { slug: "adhd" } };
      },
      async findSubscriptionForUser() {
        return null;
      },
    });
    const entitlement = await service.resolveEntitlement("user-id");

    assert.equal(entitlement.plan, "free");
    assert.equal(entitlement.source, "safe_default");
    await assert.rejects(
      service.assertMentorAccess("user-id", "adhd"),
      (error: unknown) =>
        error instanceof MentorAccessServiceError &&
        error.statusCode === 403 &&
        error.message === mentorLockedMessage &&
        error.upgradeMessage === mentorUpgradeMessage,
    );
  } finally {
    if (previousNodeEnv === undefined) {
      Reflect.deleteProperty(process.env, "NODE_ENV");
    } else {
      Reflect.set(process.env, "NODE_ENV", previousNodeEnv);
    }
  }
});

test("conversation checks use the owned conversation mentor, not client claims", async () => {
  const service = new MentorAccessService({
    async claimSingleMentor() {
      return { count: 0 };
    },
    async findOwnedConversationMentor() {
      return { mentor: { slug: "stress-burnout" } };
    },
    async findSubscriptionForUser() {
      return { plan: "FREE", selectedMentorSlug: null, status: "ACTIVE" };
    },
  });

  await assert.rejects(
    service.assertConversationMentorAccess("user-id", "conversation-id"),
    (error: unknown) =>
      error instanceof MentorAccessServiceError && error.statusCode === 403,
  );
});

test("Single Mentor claims the first specialist and rejects a different one later", async () => {
  let selectedMentorSlug: string | null = null;
  const service = new MentorAccessService({
    async claimSingleMentor(_userId, mentorSlug) {
      if (!selectedMentorSlug) selectedMentorSlug = mentorSlug;
      return { count: selectedMentorSlug === mentorSlug ? 1 : 0 };
    },
    async findOwnedConversationMentor() {
      return null;
    },
    async findSubscriptionForUser() {
      return {
        plan: "SINGLE",
        selectedMentorSlug,
        status: "ACTIVE",
      };
    },
  });

  const first = await service.assertMentorAccess("user-id", "adhd");
  assert.equal(first.entitlement.selectedMentorSlug, "adhd");

  await assert.rejects(
    service.assertMentorAccess("user-id", "charisma"),
    (error: unknown) =>
      error instanceof MentorAccessServiceError && error.statusCode === 403,
  );
});
