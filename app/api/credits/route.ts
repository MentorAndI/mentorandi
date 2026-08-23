import { NextResponse } from "next/server";

import { createSafeErrorResponse } from "@/lib/api/safe-error-response";
import {
  CreditService,
  CreditServiceError,
} from "@/services/credits/credit.service";
import { UserService, UserServiceError } from "@/services/user/user.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await new UserService().resolveAuthenticatedUser();
    const balance = await new CreditService().getBalanceForUser(user.id);

    return NextResponse.json(balance, { status: 200 });
  } catch (error) {
    if (error instanceof UserServiceError) {
      return createSafeErrorResponse({
        context: "api/credits:user",
        error,
        fallbackMessage: "Unable to load mentor credits.",
        statusCode: error.statusCode,
      });
    }

    if (error instanceof CreditServiceError) {
      return createSafeErrorResponse({
        context: "api/credits:credits",
        error,
        fallbackMessage: error.message,
        statusCode: error.statusCode,
      });
    }

    return createSafeErrorResponse({
      context: "api/credits:unexpected",
      error,
      fallbackMessage: "Unable to load mentor credits.",
    });
  }
}
