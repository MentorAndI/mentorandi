import { NextResponse } from "next/server";

import {
  TestDataCleanupService,
  TestDataCleanupServiceError,
} from "@/services/dev/test-data-cleanup.service";
import { UserService, UserServiceError } from "@/services/user/user.service";

export const dynamic = "force-dynamic";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "This development endpoint is disabled in production." },
      { status: 403 },
    );
  }

  try {
    const user = await new UserService().resolveCurrentUser();
    const result = await new TestDataCleanupService().cleanupForUser(user.id);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof UserServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    if (error instanceof TestDataCleanupServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    console.error(error);

    return NextResponse.json(
      { error: "Unable to clean test data." },
      { status: 500 },
    );
  }
}
