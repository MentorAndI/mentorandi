import { NextResponse } from "next/server";

import {
  ContextBuilderService,
  ContextBuilderServiceError,
} from "@/services/mentor-core/context-builder/context-builder.service";
import type { BuildMentorContextAuthContext } from "@/services/mentor-core/context-builder/context-builder.types";
import { validateBuildMentorContextInput } from "@/services/mentor-core/context-builder/context-builder.validators";

export const dynamic = "force-dynamic";

function getContextBuilderAuthContext(): BuildMentorContextAuthContext {
  return {
    authUserId: null,
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
    const service = new ContextBuilderService();
    const context = await service.buildMentorContext(
      validation.input,
      getContextBuilderAuthContext(),
    );

    return NextResponse.json({ context }, { status: 200 });
  } catch (error) {
    if (error instanceof ContextBuilderServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      { error: "Unable to build mentor context." },
      { status: 500 },
    );
  }
}
