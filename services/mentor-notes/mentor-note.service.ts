import { MentorNoteRepository } from "@/services/mentor-notes/mentor-note.repository";
import type {
  MentorNoteAuthContext,
  MentorNoteCandidate,
  MentorNoteDto,
  UpdateMentorNoteInput,
} from "@/services/mentor-notes/mentor-note.types";
import { UserService } from "@/services/user/user.service";

export class MentorNoteServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "MentorNoteServiceError";
  }
}

export class MentorNoteService {
  constructor(private readonly repository = new MentorNoteRepository()) {}

  async list(
    authContext: MentorNoteAuthContext,
    options?: { includeArchived?: boolean; limit?: number },
  ): Promise<MentorNoteDto[]> {
    const user = await this.ensureUser(authContext);
    const notes = await this.repository.listForUser(
      user.id,
      options?.includeArchived ?? false,
      Math.min(Math.max(options?.limit ?? 20, 1), 100),
    );

    return notes.map(toMentorNoteDto);
  }

  async createFromMentorResponse(input: {
    candidate: MentorNoteCandidate;
    conversationId: string;
    mentorId: string;
    userId: string;
  }): Promise<MentorNoteDto> {
    const [user, mentor, conversation] = await Promise.all([
      this.repository.findUserById(input.userId),
      this.repository.findMentorById(input.mentorId),
      this.repository.findConversationForUser(
        input.conversationId,
        input.userId,
      ),
    ]);

    if (!user || !mentor || !conversation || conversation.mentorId !== input.mentorId) {
      throw new MentorNoteServiceError(
        "Mentor note context could not be verified.",
        400,
      );
    }

    return toMentorNoteDto(await this.repository.createForUser(input));
  }

  async update(
    authContext: MentorNoteAuthContext,
    noteId: string,
    input: UpdateMentorNoteInput,
  ): Promise<MentorNoteDto> {
    const user = await this.ensureUser(authContext);

    if (input.archived === undefined && input.pinned === undefined) {
      throw new MentorNoteServiceError("No mentor note change was provided.", 400);
    }

    const result = await this.repository.updateForUser(noteId, user.id, input);

    if (result.count === 0) {
      throw new MentorNoteServiceError("Mentor note was not found.", 404);
    }

    const note = await this.repository.findForUser(noteId, user.id);

    if (!note) {
      throw new MentorNoteServiceError("Mentor note was not found.", 404);
    }

    return toMentorNoteDto(note);
  }

  async delete(authContext: MentorNoteAuthContext, noteId: string) {
    const user = await this.ensureUser(authContext);
    const result = await this.repository.deleteForUser(noteId, user.id);

    if (result.count === 0) {
      throw new MentorNoteServiceError("Mentor note was not found.", 404);
    }
  }

  private async ensureUser(authContext: MentorNoteAuthContext) {
    const user = await this.repository.findUserByAuthUserId(
      authContext.authUserId,
    );

    if (!user) {
      throw new MentorNoteServiceError("User was not found.", 404);
    }

    return user;
  }
}

export async function getMentorNoteAuthContext(): Promise<MentorNoteAuthContext> {
  const user = await new UserService().resolveAuthenticatedUser();

  return { authUserId: user.authUserId };
}

function toMentorNoteDto(note: {
  archivedAt: Date | null;
  content: string;
  createdAt: Date;
  id: string;
  mentor: { name: string; slug: string };
  pinned: boolean;
  title: string;
  type: MentorNoteDto["type"];
  updatedAt: Date;
}): MentorNoteDto {
  return {
    archivedAt: note.archivedAt?.toISOString() ?? null,
    content: note.content,
    createdAt: note.createdAt.toISOString(),
    id: note.id,
    mentorName: note.mentor.name,
    mentorSlug: note.mentor.slug,
    pinned: note.pinned,
    title: note.title,
    type: note.type,
    updatedAt: note.updatedAt.toISOString(),
  };
}
