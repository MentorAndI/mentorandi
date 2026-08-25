import type {
  MentorNoteCandidate,
  MentorNoteType,
} from "@/services/mentor-notes/mentor-note.types";
import { mentorNoteTypes } from "@/services/mentor-notes/mentor-note.types";

const mentorNotePattern = /\s*<mentor_note>([\s\S]*?)<\/mentor_note>\s*$/i;
const strayMentorNotePattern = /\s*<mentor_note>[\s\S]*?<\/mentor_note>\s*/gi;
const maxTitleLength = 120;
const maxContentLength = 600;

export interface ParsedMentorResponse {
  content: string;
  note: MentorNoteCandidate | null;
}

export function parseMentorResponseForNote(
  rawContent: string,
): ParsedMentorResponse {
  const match = rawContent.match(mentorNotePattern);

  if (!match) {
    return {
      content: rawContent.replace(strayMentorNotePattern, "").trim(),
      note: null,
    };
  }

  const content = rawContent.replace(mentorNotePattern, "").trim();

  try {
    const parsed = JSON.parse(match[1]) as Record<string, unknown>;
    const type = normalizeType(parsed.type);
    const title = normalizeText(parsed.title, maxTitleLength);
    const noteContent = normalizeText(parsed.content, maxContentLength);

    if (!type || !title || !noteContent) {
      return { content, note: null };
    }

    return {
      content,
      note: {
        content: noteContent,
        title,
        type,
      },
    };
  } catch {
    return { content, note: null };
  }
}

function normalizeType(value: unknown): MentorNoteType | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toUpperCase();

  return mentorNoteTypes.includes(normalized as MentorNoteType)
    ? (normalized as MentorNoteType)
    : null;
}

function normalizeText(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return "";
  }

  const normalized = value.replace(/\s+/g, " ").trim();

  if (!normalized || normalized.length > maxLength) {
    return "";
  }

  return normalized;
}
