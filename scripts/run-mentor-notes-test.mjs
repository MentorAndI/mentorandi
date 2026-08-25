import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const jiti = require("jiti")(fileURLToPath(import.meta.url));
const { parseMentorResponseForNote } = jiti(
  "../services/mentor-notes/mentor-note-parser.ts",
);

const tagged = parseMentorResponseForNote(
  `Try the two-second pause before answering.\n<mentor_note>{"type":"TECHNIQUE","title":"Two-second pause","content":"Pause for two seconds before answering in a pressured conversation."}</mentor_note>`,
);
assert.equal(tagged.content, "Try the two-second pause before answering.");
assert.equal(tagged.note?.type, "TECHNIQUE");
assert.equal(tagged.note?.title, "Two-second pause");
assert.ok(!tagged.content.includes("mentor_note"));

const ordinary = parseMentorResponseForNote("That sounds like useful progress.");
assert.equal(ordinary.note, null);
assert.equal(ordinary.content, "That sounds like useful progress.");

const malformed = parseMentorResponseForNote(
  `Keep this in mind.\n<mentor_note>not-json</mentor_note>`,
);
assert.equal(malformed.note, null);
assert.equal(malformed.content, "Keep this in mind.");

console.log("Mentor notes parser tests passed.");
