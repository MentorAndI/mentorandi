import { NextResponse } from "next/server";

import {
  MentorSessionService,
  MentorSessionServiceError,
} from "@/services/mentor/mentor-session.service";
import { UserServiceError } from "@/services/user/user.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const service = new MentorSessionService();
    const session = await service.getResolvedMarcusSession();

    return NextResponse.json(
      {
        conversation: session.conversation,
        mentor: session.mentor,
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
