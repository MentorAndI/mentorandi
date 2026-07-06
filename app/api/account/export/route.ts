import { NextResponse } from "next/server";

import { createSafeErrorResponse } from "@/lib/api/safe-error-response";
import {
  AccountDataService,
  AccountDataServiceError,
} from "@/services/account-data/account-data.service";
import {
  UserService,
  UserServiceError,
} from "@/services/user/user.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await new UserService().resolveAuthenticatedUser();
    const exportData = await new AccountDataService().exportDataForUser(user);

    return NextResponse.json(exportData, { status: 200 });
  } catch (error) {
    if (error instanceof UserServiceError) {
      return createSafeErrorResponse({
        context: "api/account/export:user",
        error,
        fallbackMessage: "Unable to export account data.",
        statusCode: error.statusCode,
      });
    }

    if (error instanceof AccountDataServiceError) {
      return createSafeErrorResponse({
        context: "api/account/export:account-data",
        error,
        fallbackMessage: "Unable to export account data.",
        statusCode: error.statusCode,
      });
    }

    return createSafeErrorResponse({
      context: "api/account/export:unexpected",
      error,
      fallbackMessage: "Unable to export account data.",
    });
  }
}
