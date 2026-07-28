import assert from "node:assert/strict";
import { test } from "node:test";

import {
  mentorResponseStyleInstructions,
  normalizeMentorResponseFormatting,
} from "@/services/mentor-core/response-formatting/mentor-response-formatting";

test("mentor response instructions reject document-like Markdown", () => {
  const instructions = mentorResponseStyleInstructions.join(" ");

  assert.match(instructions, /do not use Markdown heading syntax/i);
  assert.match(instructions, /do not use Markdown bold markers/i);
  assert.match(instructions, /plain short section labels/i);
});

test("normalizes headings and bold markers in a generated mentor plan", () => {
  const response = normalizeMentorResponseFormatting(`### Mandag — Styrke A
**30–45 min**
- **Squat eller benpres:** 3 sæt x 6–10 reps`);

  assert.equal(
    response,
    `Mandag — Styrke A
30–45 min
- Squat eller benpres: 3 sæt x 6–10 reps`,
  );
  assert.doesNotMatch(response, /^#{1,6}\s/m);
  assert.doesNotMatch(response, /\*\*/);
});
