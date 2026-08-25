"use client";

import { useEffect, useState } from "react";

import type { MentorGoal } from "@/components/mentor/mentor-conversation.types";

export interface MentorGoalPanelProps {
  goals: MentorGoal[];
  isLoading: boolean;
}

type MentorNoteType = "TECHNIQUE" | "PRACTICE" | "PLAN" | "REMEMBER";

interface MentorNote {
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

interface MentorNotesResponse {
  notes?: MentorNote[];
  error?: string;
}

export function MentorGoalPanel({ isLoading }: MentorGoalPanelProps) {
  const [notes, setNotes] = useState<MentorNote[]>([]);
  const [notesError, setNotesError] = useState("");
  const [isLoadingNotes, setIsLoadingNotes] = useState(true);
  const [busyNoteId, setBusyNoteId] = useState("");

  useEffect(() => {
    if (isLoading) {
      return;
    }

    let isActive = true;

    async function loadNotes() {
      setIsLoadingNotes(true);

      try {
        const response = await fetch("/api/mentor-notes");
        const body = (await response.json()) as MentorNotesResponse;

        if (!response.ok) {
          throw new Error(body.error || "Unable to load mentor notes.");
        }

        if (isActive) {
          setNotes(body.notes ?? []);
          setNotesError("");
        }
      } catch {
        if (isActive) {
          setNotesError("Unable to load mentor notes.");
        }
      } finally {
        if (isActive) {
          setIsLoadingNotes(false);
        }
      }
    }

    void loadNotes();

    return () => {
      isActive = false;
    };
  }, [isLoading]);

  async function updateNote(note: MentorNote, input: object) {
    setBusyNoteId(note.id);
    setNotesError("");

    try {
      const response = await fetch(
        `/api/mentor-notes/${encodeURIComponent(note.id)}`,
        {
          body: JSON.stringify(input),
          headers: { "Content-Type": "application/json" },
          method: "PATCH",
        },
      );
      const body = (await response.json()) as {
        note?: MentorNote;
        error?: string;
      };

      if (!response.ok || !body.note) {
        throw new Error(body.error || "Unable to update mentor note.");
      }

      if (body.note.archivedAt) {
        setNotes((current) => current.filter((item) => item.id !== note.id));
      } else {
        setNotes((current) =>
          sortNotes(
            current.map((item) => (item.id === note.id ? body.note! : item)),
          ),
        );
      }
    } catch {
      setNotesError("Unable to update mentor note.");
    } finally {
      setBusyNoteId("");
    }
  }

  async function deleteNote(noteId: string) {
    setBusyNoteId(noteId);
    setNotesError("");

    try {
      const response = await fetch(
        `/api/mentor-notes/${encodeURIComponent(noteId)}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        throw new Error("Unable to delete mentor note.");
      }

      setNotes((current) => current.filter((note) => note.id !== noteId));
    } catch {
      setNotesError("Unable to delete mentor note.");
    } finally {
      setBusyNoteId("");
    }
  }

  const visibleNotes = sortNotes(notes).slice(0, 8);

  return (
    <aside className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-[var(--ink)]">Mentor Notes</h2>
        <p className="mt-1 text-sm leading-6 text-[var(--ink-faint)]">
          Techniques, practices, plans and reminders your mentors want you to
          keep.
        </p>
      </div>

      {isLoadingNotes && notes.length === 0 ? (
        <p
          aria-live="polite"
          className="rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--surface-raised)] px-3 py-4 text-sm text-[var(--ink-faint)]"
          role="status"
        >
          Loading mentor notes...
        </p>
      ) : null}

      {!isLoadingNotes && notes.length === 0 ? (
        <p className="rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--surface-raised)] px-3 py-4 text-sm leading-6 text-[var(--ink-muted)]">
          When a mentor gives you a technique, practice, concrete plan or useful
          reminder worth keeping, it will appear here.
        </p>
      ) : null}

      {notesError ? (
        <p className="text-sm text-[var(--danger)]" role="alert">
          {notesError}
        </p>
      ) : null}

      {visibleNotes.length > 0 ? (
        <div className="space-y-3">
          {visibleNotes.map((note) => {
            const isBusy = busyNoteId === note.id;

            return (
              <article
                className="rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--surface-raised)] px-3 py-3"
                key={note.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-meta text-[0.64rem] font-bold uppercase text-[var(--terra-text)]">
                      {formatNoteType(note.type)}
                    </p>
                    <h3 className="mt-1 text-sm font-semibold leading-5 text-[var(--ink)]">
                      {note.title}
                    </h3>
                  </div>
                  {note.pinned ? (
                    <span className="shrink-0 text-xs font-semibold text-[var(--terra-text)]">
                      Pinned
                    </span>
                  ) : null}
                </div>

                <p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">
                  {note.content}
                </p>
                <p className="mt-2 text-xs text-[var(--ink-faint)]">
                  From {note.mentorName}
                </p>

                <div className="mt-3 flex flex-wrap gap-x-3 gap-y-2 text-xs font-semibold">
                  <button
                    className="text-[var(--terra-text)] hover:underline disabled:opacity-50"
                    disabled={isBusy}
                    onClick={() =>
                      void updateNote(note, { pinned: !note.pinned })
                    }
                    type="button"
                  >
                    {note.pinned ? "Unpin" : "Pin"}
                  </button>
                  <button
                    className="text-[var(--ink-muted)] hover:underline disabled:opacity-50"
                    disabled={isBusy}
                    onClick={() => void updateNote(note, { archived: true })}
                    type="button"
                  >
                    Archive
                  </button>
                  <button
                    className="text-[var(--danger)] hover:underline disabled:opacity-50"
                    disabled={isBusy}
                    onClick={() => void deleteNote(note.id)}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </aside>
  );
}

function sortNotes(notes: MentorNote[]) {
  return [...notes].sort((a, b) => {
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1;
    }

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

function formatNoteType(type: MentorNoteType) {
  return {
    PLAN: "Plan",
    PRACTICE: "Practice",
    REMEMBER: "Remember",
    TECHNIQUE: "Technique",
  }[type];
}
