import { NextResponse } from "next/server";

import {
  MentorResponsePipelineService,
  MentorResponsePipelineServiceError,
} from "@/services/mentor-core/response-pipeline/response-pipeline.service";
import type { MentorResponsePipelineAuthContext } from "@/services/mentor-core/response-pipeline/response-pipeline.types";
import { validateMentorResponsePipelineInput } from "@/services/mentor-core/response-pipeline/response-pipeline.validators";
import {
  UserService,
  UserServiceError,
} from "@/services/user/user.service";

export const dynamic = "force-dynamic";

async function getMentorResponsePipelineAuthContext(): Promise<{
  authContext: MentorResponsePipelineAuthContext;
  userId: string;
}> {
  const user = await new UserService().resolveCurrentUser();

  return {
    authContext: {
      authUserId: user.authUserId,
    },
    userId: user.id,
  };
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const validation = validateMentorResponsePipelineInput(body);

  if (!validation.isValid || !validation.input) {
    return NextResponse.json(
      { errors: validation.errors },
      { status: 400 },
    );
  }

  try {
    const { authContext, userId } = await getMentorResponsePipelineAuthContext();

    if (validation.input.userId !== userId) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const service = new MentorResponsePipelineService();
    const response = await service.run(validation.input, authContext);

    return NextResponse.json({ response }, { status: 200 });
  } catch (error) {
    if (error instanceof UserServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    if (error instanceof MentorResponsePipelineServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      { error: "Unable to run mentor response pipeline." },
      { status: 500 },
    );
  }
}
