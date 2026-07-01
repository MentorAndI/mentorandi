import { NextResponse } from "next/server";

import {
  MentorResponsePipelineService,
  MentorResponsePipelineServiceError,
} from "@/services/mentor-core/response-pipeline/response-pipeline.service";
import type { MentorResponsePipelineAuthContext } from "@/services/mentor-core/response-pipeline/response-pipeline.types";
import { validateMentorResponsePipelineInput } from "@/services/mentor-core/response-pipeline/response-pipeline.validators";

export const dynamic = "force-dynamic";

function getMentorResponsePipelineAuthContext(): MentorResponsePipelineAuthContext {
  return {
    authUserId: null,
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
    const service = new MentorResponsePipelineService();
    const response = await service.run(
      validation.input,
      getMentorResponsePipelineAuthContext(),
    );

    return NextResponse.json({ response }, { status: 200 });
  } catch (error) {
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
