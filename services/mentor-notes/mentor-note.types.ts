export const mentorNoteTypes = [
  "TECHNIQUE",
  "PRACTICE",
  "PLAN",
  "REMEMBER",
] as const;

export type MentorNoteType = (typeof mentorNoteTypes)[number];

export interface MentorNoteCandidate {
  content: string;
  title: string;
  type: MentorNoteType;
}

export interface MentorNoteDto {
  archivedAt: string | null;
  content: string;
  createdAt: string;
  id: string;
  mentorName: string;
  mentorSlug: string;
  pinned: boolean;
  title: string;
  type: MentorNoteType;
  updatedAt: string;
}

export interface MentorNoteAuthContext {
  authUserId: string;
}

export interface UpdateMentorNoteInput {
  archived?: boolean;
  pinned?: boolean;
}
