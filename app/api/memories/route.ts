import { NextResponse } from "next/server";

import {
  getMemoryAuthContext,
  MemoryService,
  MemoryServiceError,
} from "@/services/memory/memory.service";
import { UserServiceError } from "@/services/user/user.service";
import {
  validateCreateMemoryInput,
  validateMemoryFilters,
} from "@/services/memory/memory.validators";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const filtersValidation = validateMemoryFilters(
    new URL(request.url).searchParams,
  );

  if (!filtersValidation.isValid || !filtersValidation.input) {
    return NextResponse.json(
      { errors: filtersValidation.errors },
      { status: 400 },
    );
  }

  try {
    const service = new MemoryService();
    const understandings = await service.listMentorUnderstandings(
      await getMemoryAuthContext(),
      filtersValidation.input,
    );

    return NextResponse.json({ understandings }, { status: 200 });
  } catch (error) {
    if (error instanceof UserServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      { error: "Unable to load memories." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const validation = validateCreateMemoryInput(body);

  if (!validation.isValid || !validation.input) {
    return NextResponse.json(
      { errors: validation.errors },
      { status: 400 },
    );
  }

  try {
    const service = new MemoryService();
    const understanding = await service.createMentorUnderstanding(
      await getMemoryAuthContext(),
      validation.input,
    );

    return NextResponse.json({ understanding }, { status: 201 });
  } catch (error) {
    if (error instanceof MemoryServiceError) {
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
      { error: "Unable to create memory." },
      { status: 500 },
    );
  }
}
