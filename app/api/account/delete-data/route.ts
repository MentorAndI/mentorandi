import { NextResponse } from "next/server";

import { createSafeErrorResponse } from "@/lib/api/safe-error-response";
import {
  AccountDataService,
  AccountDataServiceError,
} from "@/services/account-data/account-data.service";
import { validateAccountDataDeleteInput } from "@/services/account-data/account-data.validators";
import {
  UserService,
  UserServiceError,
} from "@/services/user/user.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const validation = validateAccountDataDeleteInput(body);

  if (!validation.isValid || !validation.input) {
    return NextResponse.json(
      { errors: validation.errors },
      { status: 400 },
    );
  }

  try {
    const user = await new UserService().resolveAuthenticatedUser();
    const counts = await new AccountDataService().deleteMentorDataForUser(user);

    return NextResponse.json({ counts }, { status: 200 });
  } catch (error) {
    if (error instanceof UserServiceError) {
      return createSafeErrorResponse({
        context: "api/account/delete-data:user",
        error,
        fallbackMessage: "Unable to delete account data.",
        statusCode: error.statusCode,
      });
    }

    if (error instanceof AccountDataServiceError) {
      return createSafeErrorResponse({
        context: "api/account/delete-data:account-data",
        error,
        fallbackMessage: "Unable to delete account data.",
        statusCode: error.statusCode,
      });
    }

    return createSafeErrorResponse({
      context: "api/account/delete-data:unexpected",
      error,
      fallbackMessage: "Unable to delete account data.",
    });
  }
}
