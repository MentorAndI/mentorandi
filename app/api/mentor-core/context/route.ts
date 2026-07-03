import { NextResponse } from "next/server";

import { createSafeErrorResponse } from "@/lib/api/safe-error-response";
import {
  ContextBuilderService,
  ContextBuilderServiceError,
} from "@/services/mentor-core/context-builder/context-builder.service";
import type { BuildMentorContextAuthContext } from "@/services/mentor-core/context-builder/context-builder.types";
import { validateBuildMentorContextInput } from "@/services/mentor-core/context-builder/context-builder.validators";
import {
  UserService,
  UserServiceError,
} from "@/services/user/user.service";

export const dynamic = "force-dynamic";

async function getContextBuilderAuthContext(): Promise<{
  authContext: BuildMentorContextAuthContext;
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
  const validation = validateBuildMentorContextInput(body);

  if (!validation.isValid || !validation.input) {
    return NextResponse.json(
      { errors: validation.errors },
      { status: 400 },
    );
  }

  try {
    const { authContext, userId } = await getContextBuilderAuthContext();

    if (validation.input.userId !== userId) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const service = new ContextBuilderService();
    const context = await service.buildMentorContext(
      validation.input,
      authContext,
    );

    return NextResponse.json({ context }, { status: 200 });
  } catch (error) {
    if (error instanceof UserServiceError) {
      return createSafeErrorResponse({
        context: "api/mentor-core/context:user",
        error,
        fallbackMessage: "Unable to build mentor context.",
        statusCode: error.statusCode,
      });
    }

    if (error instanceof ContextBuilderServiceError) {
      return createSafeErrorResponse({
        context: "api/mentor-core/context:context-builder",
        error,
        fallbackMessage: "Unable to build mentor context.",
        statusCode: error.statusCode,
      });
    }

    return createSafeErrorResponse({
      context: "api/mentor-core/context:unexpected",
      error,
      fallbackMessage: "Unable to build mentor context.",
    });
  }
}
