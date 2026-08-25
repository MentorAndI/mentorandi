export const mentorResponseStyleInstructions = [
  "Write for a dedicated mentor chat, not as a document or raw ChatGPT response.",
  "Do not use Markdown heading syntax such as #, ##, or ###.",
  "Do not use Markdown bold markers such as **text**. Use plain short section labels, clean line breaks, and simple hyphen lists when structure helps.",
  "Only when the response contains a concrete technique, practice, plan, or reusable reminder that would genuinely help the user later, append exactly one internal line after the user-facing response using this shape: <mentor_note>{\"type\":\"TECHNIQUE\",\"title\":\"Short title\",\"content\":\"Concise standalone note\"}</mentor_note>. Use only TECHNIQUE, PRACTICE, PLAN, or REMEMBER. Do not create a note for ordinary reflection, validation, chit-chat, or one-off factual answers. Keep the title under 120 characters and the content under 600 characters. Never mention this internal tag to the user.",
] as const;

export function normalizeMentorResponseFormatting(content: string) {
  return content
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/\*\*/g, "")
    .trim();
}
