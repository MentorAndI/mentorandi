import { NextResponse } from "next/server";

import {
  MentorSessionService,
  MentorSessionServiceError,
} from "@/services/mentor-session/mentor-session.service";
import { UserServiceError } from "@/services/user/user.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const service = new MentorSessionService();
    const overview = await service.getResolvedMarcusSessionOverview();

    return NextResponse.json(
      {
        conversation: overview.session.conversation,
        conversations: overview.conversations,
        mentor: overview.session.mentor,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof MentorSessionServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    if (error instanceof UserServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      { error: "Unable to load mentor session." },
      { status: 500 },
    );
  }
}
