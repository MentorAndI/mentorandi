import { NextResponse } from "next/server";

import {
  MentorSessionService,
  MentorSessionServiceError,
} from "@/services/mentor/mentor-session.service";

export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Mentor session requires authenticated user resolution." },
      { status: 401 },
    );
  }

  try {
    const service = new MentorSessionService();
    const session = await service.getDevelopmentMarcusSession();

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

    return NextResponse.json(
      { error: "Unable to load mentor session." },
      { status: 500 },
    );
  }
}
