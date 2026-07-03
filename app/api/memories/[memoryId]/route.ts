import { NextResponse } from "next/server";

import { createSafeErrorResponse } from "@/lib/api/safe-error-response";
import {
  getMemoryAuthContext,
  MemoryService,
  MemoryServiceError,
} from "@/services/memory/memory.service";
import { UserServiceError } from "@/services/user/user.service";
import {
  validateMemoryId,
  validateUpdateMemoryInput,
} from "@/services/memory/memory.validators";

export const dynamic = "force-dynamic";

interface MemoryRouteContext {
  params: Promise<{
    memoryId: string;
  }>;
}

export async function GET(_request: Request, context: MemoryRouteContext) {
  const { memoryId } = await context.params;
  const memoryIdValidation = validateMemoryId(memoryId);

  if (!memoryIdValidation.isValid || !memoryIdValidation.input) {
    return NextResponse.json(
      { errors: memoryIdValidation.errors },
      { status: 400 },
    );
  }

  try {
    const service = new MemoryService();
    const understanding = await service.getMentorUnderstanding(
      await getMemoryAuthContext(),
      memoryIdValidation.input.memoryId,
    );

    return NextResponse.json({ understanding }, { status: 200 });
  } catch (error) {
    return handleMemoryRouteError(error, "Unable to load memory.");
  }
}

export async function PATCH(request: Request, context: MemoryRouteContext) {
  const { memoryId } = await context.params;
  const memoryIdValidation = validateMemoryId(memoryId);

  if (!memoryIdValidation.isValid || !memoryIdValidation.input) {
    return NextResponse.json(
      { errors: memoryIdValidation.errors },
      { status: 400 },
    );
  }

  const body = await request.json().catch(() => null);
  const updateValidation = validateUpdateMemoryInput(body);

  if (!updateValidation.isValid || !updateValidation.input) {
    return NextResponse.json(
      { errors: updateValidation.errors },
      { status: 400 },
    );
  }

  try {
    const service = new MemoryService();
    const understanding = await service.updateMentorUnderstanding(
      await getMemoryAuthContext(),
      memoryIdValidation.input.memoryId,
      updateValidation.input,
    );

    return NextResponse.json({ understanding }, { status: 200 });
  } catch (error) {
    return handleMemoryRouteError(error, "Unable to update memory.");
  }
}

export async function DELETE(_request: Request, context: MemoryRouteContext) {
  const { memoryId } = await context.params;
  const memoryIdValidation = validateMemoryId(memoryId);

  if (!memoryIdValidation.isValid || !memoryIdValidation.input) {
    return NextResponse.json(
      { errors: memoryIdValidation.errors },
      { status: 400 },
    );
  }

  try {
    const service = new MemoryService();
    await service.deleteMentorUnderstanding(
      await getMemoryAuthContext(),
      memoryIdValidation.input.memoryId,
    );

    return new Response(null, { status: 204 });
  } catch (error) {
    return handleMemoryRouteError(error, "Unable to delete memory.");
  }
}

function handleMemoryRouteError(error: unknown, fallbackMessage: string) {
  if (error instanceof MemoryServiceError) {
    return createSafeErrorResponse({
      context: "api/memories/[memoryId]:memory",
      error,
      fallbackMessage,
      statusCode: error.statusCode,
    });
  }

  if (error instanceof UserServiceError) {
    return createSafeErrorResponse({
      context: "api/memories/[memoryId]:user",
      error,
      fallbackMessage,
      statusCode: error.statusCode,
    });
  }

  return createSafeErrorResponse({
    context: "api/memories/[memoryId]:unexpected",
    error,
    fallbackMessage,
  });
}
