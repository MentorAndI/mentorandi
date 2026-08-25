import { getPrismaClient } from "@/lib/prisma";
import type {
  MentorNoteCandidate,
  UpdateMentorNoteInput,
} from "@/services/mentor-notes/mentor-note.types";

export class MentorNoteRepository {
  private readonly prisma = getPrismaClient();

  findUserByAuthUserId(authUserId: string) {
    return this.prisma.user.findUnique({ where: { authUserId } });
  }

  findUserById(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }

  findConversationForUser(conversationId: string, userId: string) {
    return this.prisma.conversation.findFirst({
      where: { id: conversationId, userId },
    });
  }

  findMentorById(mentorId: string) {
    return this.prisma.mentor.findUnique({ where: { id: mentorId } });
  }

  listForUser(userId: string, includeArchived = false, limit = 20) {
    return this.prisma.mentorNote.findMany({
      include: {
        mentor: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: limit,
      where: {
        userId,
        ...(includeArchived ? {} : { archivedAt: null }),
      },
    });
  }

  createForUser(input: {
    candidate: MentorNoteCandidate;
    conversationId: string;
    mentorId: string;
    userId: string;
  }) {
    return this.prisma.mentorNote.create({
      data: {
        content: input.candidate.content,
        conversationId: input.conversationId,
        mentorId: input.mentorId,
        title: input.candidate.title,
        type: input.candidate.type,
        userId: input.userId,
      },
      include: {
        mentor: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    });
  }

  updateForUser(noteId: string, userId: string, input: UpdateMentorNoteInput) {
    return this.prisma.mentorNote.updateMany({
      data: {
        ...(input.archived !== undefined
          ? { archivedAt: input.archived ? new Date() : null }
          : {}),
        ...(input.pinned !== undefined ? { pinned: input.pinned } : {}),
      },
      where: { id: noteId, userId },
    });
  }

  findForUser(noteId: string, userId: string) {
    return this.prisma.mentorNote.findFirst({
      include: {
        mentor: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
      where: { id: noteId, userId },
    });
  }

  deleteForUser(noteId: string, userId: string) {
    return this.prisma.mentorNote.deleteMany({
      where: { id: noteId, userId },
    });
  }
}
