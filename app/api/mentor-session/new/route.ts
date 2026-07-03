import { NextResponse } from "next/server";

import {
  MentorSessionService,
  MentorSessionServiceError,
} from "@/services/mentor-session/mentor-session.service";
import { UserServiceError } from "@/services/user/user.service";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const service = new MentorSessionService();
    const session = await service.createNewMarcusSession();

    return NextResponse.json(
      { conversationId: session.conversation.id },
      { status: 201 },
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
      { error: "Unable to start a new conversation." },
      { status: 500 },
    );
  }
}
