export const mentorResponseStyleInstructions = [
  "Write for a dedicated mentor chat, not as a document or raw ChatGPT response.",
  "Do not use Markdown heading syntax such as #, ##, or ###.",
  "Do not use Markdown bold markers such as **text**. Use plain short section labels, clean line breaks, and simple hyphen lists when structure helps.",
] as const;

export function normalizeMentorResponseFormatting(content: string) {
  return content
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/\*\*/g, "")
    .trim();
}
