import { NextResponse } from "next/server";

import {
  UserService,
  UserServiceError,
} from "@/services/user/user.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const service = new UserService();
    const user = await service.resolveCurrentUser();

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    if (error instanceof UserServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      { error: "Unable to resolve current user." },
      { status: 500 },
    );
  }
}
