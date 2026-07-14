import { NextResponse } from "next/server";

import { createSafeErrorResponse } from "@/lib/api/safe-error-response";
import {
  FeedbackService,
  FeedbackServiceError,
} from "@/services/feedback/feedback.service";
import { validateCreateFeedbackInput } from "@/services/feedback/feedback.validators";
import { UserService, UserServiceError } from "@/services/user/user.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const validation = validateCreateFeedbackInput(body);

  if (!validation.isValid || !validation.input) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 });
  }

  try {
    const user = await new UserService().resolveAuthenticatedUser();
    await new FeedbackService().createFeedbackForUserId(
      user.id,
      validation.input,
    );

    return NextResponse.json({ received: true }, { status: 201 });
  } catch (error) {
    if (error instanceof UserServiceError) {
      return createSafeErrorResponse({
        context: "api/feedback:user",
        error,
        fallbackMessage: "Feedback could not be saved.",
        statusCode: error.statusCode,
      });
    }

    if (error instanceof FeedbackServiceError) {
      return createSafeErrorResponse({
        context: "api/feedback:feedback",
        error,
        fallbackMessage: "Feedback could not be saved.",
        statusCode: error.statusCode,
      });
    }

    return createSafeErrorResponse({
      context: "api/feedback:unexpected",
      error,
      fallbackMessage: "Feedback could not be saved.",
    });
  }
}
