import { NextResponse } from "next/server";

import { createSafeErrorResponse } from "@/lib/api/safe-error-response";
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
import {
  isUsageLimitReached,
  UsageLimitService,
} from "@/services/usage-limits/usage-limits.service";

export const dynamic = "force-dynamic";

async function getMentorResponsePipelineAuthContext(): Promise<{
  authContext: MentorResponsePipelineAuthContext;
  userId: string;
}> {
  const user = await new UserService().resolveAuthenticatedUser();

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

    const usageDecision = new UsageLimitService().checkAndRecord({
      scope: "mentor-core-response",
      subjectId: userId,
    });

    if (isUsageLimitReached(usageDecision.status)) {
      return createUsageLimitResponse();
    }

    const service = new MentorResponsePipelineService();
    const response = await service.run(validation.input, authContext);

    return NextResponse.json({ response }, { status: 200 });
  } catch (error) {
    if (error instanceof UserServiceError) {
      return createSafeErrorResponse({
        context: "api/mentor-core/respond:user",
        error,
        fallbackMessage: "Unable to run mentor response pipeline.",
        statusCode: error.statusCode,
      });
    }

    if (error instanceof MentorResponsePipelineServiceError) {
      return createSafeErrorResponse({
        context: "api/mentor-core/respond:pipeline",
        error,
        fallbackMessage: "Unable to run mentor response pipeline.",
        statusCode: error.statusCode,
      });
    }

    return createSafeErrorResponse({
      context: "api/mentor-core/respond:unexpected",
      error,
      fallbackMessage: "Unable to run mentor response pipeline.",
    });
  }
}

function createUsageLimitResponse() {
  return NextResponse.json(
    {
      error: "Usage limit reached. Please try again later.",
    },
    { status: 429 },
  );
}
