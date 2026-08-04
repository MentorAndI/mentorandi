import assert from "node:assert/strict";
import { test } from "node:test";

import { getConversationAuthorLabel } from "@/components/mentor/mentor-display-name";
import {
  getActiveMentorProfile,
  getMentorDisplayName,
} from "@/services/mentor-catalog/mentor-catalog";

test("uses the selected specialist display name for mentor messages", () => {
  assert.equal(
    getConversationAuthorLabel("ASSISTANT", "Health & Fitness Mentor"),
    "Health & Fitness Mentor",
  );
});

test("preserves Marcus for Life Mentor messages", () => {
  assert.equal(getConversationAuthorLabel("ASSISTANT", "Marcus"), "Marcus");
});

test("continues to label user messages as You", () => {
  assert.equal(
    getConversationAuthorLabel("USER", "Health & Fitness Mentor"),
    "You",
  );
});

test("resolves persona names from the selected mentor profile", () => {
  const healthMentor = getActiveMentorProfile("health-fitness");
  const lifeMentor = getActiveMentorProfile("life");

  assert.ok(healthMentor);
  assert.ok(lifeMentor);
  assert.equal(getMentorDisplayName(healthMentor), "Leo");
  assert.equal(getMentorDisplayName(lifeMentor), "Marcus");
});
