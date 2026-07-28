import { NextResponse } from "next/server";

import { createSafeErrorResponse } from "@/lib/api/safe-error-response";
import {
  MentorSessionService,
  MentorSessionServiceError,
} from "@/services/mentor-session/mentor-session.service";
import { UserServiceError } from "@/services/user/user.service";
import {
  getActiveMentorProfileByDatabaseSlug,
  getMentorDisplayName,
  isActiveMentorSlug,
} from "@/services/mentor-catalog/mentor-catalog";
import type { ActiveMentorSlug } from "@/services/mentor-catalog/mentor-catalog.types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const mentorSlug = readMentorSlug(request);

  if (!mentorSlug) {
    return NextResponse.json(
      { errors: { mentor: "Mentor is not active." } },
      { status: 400 },
    );
  }

  try {
    const service = new MentorSessionService();
    const overview = await service.getResolvedMentorSessionOverview(mentorSlug);

    return NextResponse.json(
      {
        activeGoals: overview.activeGoals,
        conversation: overview.session.conversation,
        conversations: overview.conversations.flatMap((conversation) => {
          const profile = getActiveMentorProfileByDatabaseSlug(
            conversation.mentor.slug,
          );

          return profile
            ? [
                {
                  createdAt: conversation.createdAt,
                  id: conversation.id,
                  latestMessageAt: conversation.latestMessageAt,
                  latestMessagePreview: conversation.latestMessagePreview,
                  mentor: {
                    name: getMentorDisplayName(profile),
                    role:
                      profile.slug === "life"
                        ? "Life Mentor"
                        : "Specialized Mentor",
                    slug: profile.slug,
                    tagline: profile.shortDescription,
                  },
                  updatedAt: conversation.updatedAt,
                },
              ]
            : [];
        }),
        mentor: overview.session.mentor,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof MentorSessionServiceError) {
      return createSafeErrorResponse({
        context: "api/mentor/session:session",
        error,
        fallbackMessage: "Unable to load mentor session.",
        statusCode: error.statusCode,
      });
    }

    if (error instanceof UserServiceError) {
      return createSafeErrorResponse({
        context: "api/mentor/session:user",
        error,
        fallbackMessage: "Unable to load mentor session.",
        statusCode: error.statusCode,
      });
    }

    return createSafeErrorResponse({
      context: "api/mentor/session:unexpected",
      error,
      fallbackMessage: "Unable to load mentor session.",
    });
  }
}

function readMentorSlug(request: Request): ActiveMentorSlug | null {
  const url = new URL(request.url);
  const value = url.searchParams.get("mentor")?.trim() || "life";

  return isActiveMentorSlug(value) ? value : null;
}
