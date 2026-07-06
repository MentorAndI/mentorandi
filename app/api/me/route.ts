import { NextResponse } from "next/server";

import { createSafeErrorResponse } from "@/lib/api/safe-error-response";
import {
  UserService,
  UserServiceError,
} from "@/services/user/user.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const service = new UserService();
    const user = await service.resolveAuthenticatedUser();

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    if (error instanceof UserServiceError) {
      return createSafeErrorResponse({
        context: "api/me:user",
        error,
        fallbackMessage: "Unable to resolve current user.",
        statusCode: error.statusCode,
      });
    }

    return createSafeErrorResponse({
      context: "api/me:unexpected",
      error,
      fallbackMessage: "Unable to resolve current user.",
    });
  }
}
