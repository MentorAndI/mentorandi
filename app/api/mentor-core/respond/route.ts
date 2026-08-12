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
  MentorUsageLimitService,
  MentorUsageMonitoringError,
} from "@/services/usage-limits/mentor-usage-limits.service";
import {
  MentorAccessService,
  MentorAccessServiceError,
} from "@/services/mentor-access/mentor-access.service";

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
    const authUserId = authContext.authUserId;

    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    if (validation.input.userId !== userId) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    await new MentorAccessService().assertConversationMentorAccess(
      userId,
      validation.input.conversationId,
    );

    const usageLimitService = new MentorUsageLimitService();
    const usageContext = {
      authUserId,
      conversationId: validation.input.conversationId,
      message: validation.input.message,
      model: validation.input.model,
      provider: validation.input.provider,
      userId,
    };
    const usageDecision =
      await usageLimitService.checkBeforeMentorResponse(usageContext);

    if (usageDecision.message) {
      return createUsageLimitResponse(usageDecision.message);
    }

    const service = new MentorResponsePipelineService();
    let response;

    try {
      response = await service.run(validation.input, authContext);
    } catch (error) {
      await usageLimitService.recordFailedMentorResponse({
        ...usageContext,
        errorCode:
          error instanceof MentorResponsePipelineServiceError
            ? (error.providerErrorState ?? "pipeline_error")
            : "pipeline_error",
        modelRouting: usageDecision.modelRouting,
      });
      throw error;
    }

    await usageLimitService.recordSuccessfulMentorResponse({
      ...usageContext,
      llmUsage: response.llmUsage,
      specialistContext: response.promptPackage.specialistContext,
    });

    return NextResponse.json({ response }, { status: 200 });
  } catch (error) {
    if (error instanceof MentorAccessServiceError) {
      return NextResponse.json(
        {
          error: error.message,
          ...(error.upgradeMessage
            ? { upgradeMessage: error.upgradeMessage }
            : {}),
        },
        { status: error.statusCode },
      );
    }

    if (error instanceof MentorUsageMonitoringError) {
      return createSafeErrorResponse({
        context: "api/mentor-core/respond:usage",
        error,
        fallbackMessage: error.message,
        statusCode: error.statusCode,
      });
    }

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

function createUsageLimitResponse(message: string) {
  return NextResponse.json(
    {
      error: message,
    },
    { status: 429 },
  );
}
